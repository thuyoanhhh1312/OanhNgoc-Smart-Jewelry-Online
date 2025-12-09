import db from "../models/index.js";
import axios from "axios";
import { VALID_HIDE_REASON_VALUES } from "../config/reviewConstants.js";

export const getReviewsByProductId = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const reviews = await db.ProductReview.findAll({
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
      ],
      where: {
        product_id: productId,
        is_hidden: false, // Chỉ lấy review chưa bị ẩn (công khai)
      },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      reviews,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy danh sách đánh giá",
      error: err.message,
    });
  }
};
// ADMIN: Gán nhãn sentiment thủ công (không thay đổi rating)
export const adminLabelSentiment = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { sentiment } = req.body; // "POS" | "NEG" | "NEU" | "UNC"

    const allowedSentiments = ["POS", "NEG", "NEU", "UNC", null];

    if (!allowedSentiments.includes(sentiment)) {
      return next({
        statusCode: 400,
        message: "Sentiment không hợp lệ (POS, NEG, NEU, UNC hoặc null)",
      });
    }

    const review = await db.ProductReview.findByPk(reviewId);
    if (!review) {
      return next({
        statusCode: 404,
        message: "Không tìm thấy review",
      });
    }

    // 👉 KHÔNG đổi rating
    review.sentiment = sentiment;
    review.sentiment_confidence = 1.0; // do admin gán → tin cậy 100%
    review.use_for_stats = true; // cho vào thống kê
    review.updated_at = new Date();

    // Nếu review này trước đó nằm trong hàng chờ duyệt
    review.needs_admin_review = false;
    if (review.admin_review_status === "pending") {
      review.admin_review_status = "approved";
    }

    await review.save();

    return res.status(200).json({
      message: "Gán nhãn sentiment thành công",
      review,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi gán nhãn sentiment",
      error: error.message,
    });
  }
};

export const createReview = async (req, res, next) => {
  const productId = req.params.id;
  const { user_id, rating, content } = req.body;

  try {
    // ====== Tìm customer_id từ user_id ======
    const customer = await db.Customer.findOne({
      where: { user_id },
    });

    const customer_id = customer?.customer_id;

    if (!customer_id || !rating || !content) {
      return next({
        statusCode: 400,
        message:
          "Thiếu dữ liệu bắt buộc: customer_id, rating hoặc nội dung đánh giá",
      });
    }

    // ====== Biến mặc định ======
    let sentiment = null;
    let sentimentConfidence = 0;
    let useForStats = true;

    let isToxic = false;
    let toxicScore = 0;
    let toxicCategories = {};
    let toxicTypes = [];
    let toxicReason = "";
    let toxicConfidence = 0;

    let needsAdminReview = false;
    let adminReviewStatus = null;
    let isHidden = false; // ẩn cho tới khi admin duyệt nếu pipeline yêu cầu

    // ================== GỌI PIPELINE /analyze ==================
    try {
      const toxicRes = await axios.post(
        "http://localhost:5002/analyze",
        { text: content },
        { timeout: 8000 }
      );

      console.log(
        "📨 Full Pipeline Response:",
        JSON.stringify(toxicRes.data, null, 2)
      );

      const pipeline = toxicRes.data || {};
      const pipelineStatus = pipeline.status || "APPROVED";
      const pipelineReason = pipeline.reason || "";
      const finalDecision = pipeline.final_decision || {};
      const layers = pipeline.layers || [];

      // ===== Lấy kết quả L1 (Toxic Filter) =====
      const l1 =
        layers.find((l) => l.layer === 1) ||
        layers[0] || // fallback
        null;

      if (l1) {
        // l1.toxic_scores chứa { toxic, severe_toxic,... }
        if (l1.toxic_scores) {
          toxicCategories = l1.toxic_scores;
          toxicScore = Number(l1.toxic_scores.toxic || 0);
          toxicConfidence = toxicScore;
        }

        // l1.toxic_categories là mảng label vượt ngưỡng
        if (Array.isArray(l1.toxic_categories)) {
          toxicTypes = l1.toxic_categories;
        }

        toxicReason = l1.reason || pipelineReason || "";
      }

      // isToxic: nếu bị block hoặc soft_flag ở L1/pipeline
      isToxic =
        pipelineStatus === "BLOCKED" ||
        pipelineStatus === "SOFT_FLAG" ||
        (l1 && l1.status && l1.status !== "PASS");

      // ===== Lấy sentiment từ L4 trong final_decision =====
      // ===== LẤY SENTIMENT TỪ FINAL_DECISION (L4) =====
      const sentimentInfo = finalDecision.sentiment_info;

      if (sentimentInfo) {
        // POS / NEG / NEU
        sentiment = sentimentInfo.sentiment || null;
        sentimentConfidence =
          typeof sentimentInfo.confidence === "number"
            ? sentimentInfo.confidence
            : Number(sentimentInfo.confidence || 0);
      } else if (typeof finalDecision.sentiment === "string") {
        // fallback: nếu không có sentiment_info thì dùng field sentiment
        sentiment = finalDecision.sentiment;
        sentimentConfidence = 0;
      }

      console.log(">>> Sentiment from pipeline:", {
        sentiment,
        sentimentConfidence,
        rawSentimentInfo: sentimentInfo,
      });

      // Dùng cờ use_for_stats + display_on_ui từ pipeline
      useForStats =
        finalDecision.use_for_stats !== undefined
          ? !!finalDecision.use_for_stats
          : true;

      const displayOnUi =
        finalDecision.display_on_ui !== undefined
          ? !!finalDecision.display_on_ui
          : true;

      // Nếu pipeline không cho hiển thị (BLOCKED / SOFT_FLAG / ADMIN_REVIEW có display_on_ui=false)
      // thì ẩn review cho tới khi admin duyệt
      isHidden = !displayOnUi;

      // ===== Quy đổi trạng thái pipeline → needs_admin_review =====
      if (pipelineStatus === "BLOCKED") {
        needsAdminReview = true;
        adminReviewStatus = "pending";
        console.log("🚫 BLOCKED - AUTO CHẶN + VÀO HÀNG CHỜ ADMIN", {
          reason: pipelineReason,
          queue_reason: finalDecision.queue_reason,
        });
      } else if (
        pipelineStatus === "SOFT_FLAG" ||
        pipelineStatus === "ADMIN_REVIEW"
      ) {
        needsAdminReview = true;
        adminReviewStatus = "pending";
        console.log("⚠️ SOFT FLAG / ADMIN_REVIEW - CẦN ADMIN DUYỆT", {
          reason: pipelineReason,
          queue_reason: finalDecision.queue_reason,
        });
      } else {
        // APPROVED
        needsAdminReview = false;
        adminReviewStatus = null;
        console.log("✅ APPROVED - AUTO PUBLISH", { reason: pipelineReason });
      }

      console.log("✅ Pipeline Processing Complete:", {
        pipelineStatus,
        use_for_stats: useForStats,
        display_on_ui: displayOnUi,
        needs_admin_review: needsAdminReview,
        is_hidden: isHidden,
      });
    } catch (pipelineErr) {
      console.error("Error in pipeline /analyze:", pipelineErr.message);
      // Fallback: cho qua nhưng flag cần admin check
      needsAdminReview = true;
      adminReviewStatus = "pending";
      useForStats = true;
      isHidden = false; // không có thông tin nên vẫn hiển thị
    }

    // ================== TẠO REVIEW TRONG DB ==================
    const newReview = await db.ProductReview.create({
      product_id: productId,
      customer_id,
      rating,
      content,

      // Sentiment (L4)
      sentiment,
      sentiment_confidence: sentimentConfidence,
      is_meta_review: false, // meta-review đã được L3 chặn qua pipeline (ADMIN_REVIEW)
      meta_confidence: 0,
      use_for_stats: useForStats,

      // Toxic Filter fields (L1)
      is_toxic: isToxic,
      toxic_score: toxicScore,
      toxic_categories: toxicCategories,
      toxic_types: toxicTypes,
      toxic_reason: toxicReason,
      toxic_confidence: toxicConfidence,

      // Admin review
      needs_admin_review: needsAdminReview,
      admin_review_status: adminReviewStatus,

      // Ẩn/hiện auto theo pipeline
      is_hidden: isHidden,
      hidden_reason: isHidden ? "AUTO_PIPELINE_REVIEW" : null,

      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({
      message: needsAdminReview
        ? "Review được tạo nhưng cần duyệt admin trước khi hiển thị"
        : "Tạo đánh giá thành công",
      review: newReview,
      toxic_detection: {
        is_toxic: isToxic,
        toxic_score: toxicScore,
        toxic_reason: toxicReason,
        needs_admin_review: needsAdminReview,
      },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi tạo đánh giá",
      error: err.message,
    });
  }
};

export const getReviewSummary = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const reviews = await db.ProductReview.findAll({
      where: { product_id: productId },
      attributes: ["rating", "sentiment", "use_for_stats"],
    });

    const totalReviews = reviews.length;

    // Tính trung bình rating CHỈ từ reviews có use_for_stats = true (loại meta-reviews)
    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const totalRating = reviewsForStats.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      reviewsForStats.length > 0
        ? (totalRating / reviewsForStats.length).toFixed(2)
        : 0;

    // Đếm số lượng review theo sentiment
    const sentimentCount = { POS: 0, NEG: 0, NEU: 0, UNKNOWN: 0 };
    // Đếm số lượng review theo từng mức rating 1..5
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      // Đếm sentiment
      if (r.sentiment && sentimentCount.hasOwnProperty(r.sentiment)) {
        sentimentCount[r.sentiment]++;
      } else {
        sentimentCount.UNKNOWN++;
      }
      // Đếm rating
      if (r.rating && ratingDistribution.hasOwnProperty(r.rating.toString())) {
        ratingDistribution[r.rating.toString()]++;
      }
    });

    return res.status(200).json({
      message: "Tổng quan đánh giá sản phẩm",
      data: {
        totalReviews,
        avgRating: parseFloat(avgRating),
        sentimentCount,
        ratingDistribution,
      },
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy tổng quan đánh giá",
      error: error.message,
    });
  }
};

// Enhanced summary với suspicious review detection
export const getReviewSummaryWithSuspicious = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const reviews = await db.ProductReview.findAll({
      include: [
        {
          model: db.Customer,
          attributes: ["name"],
        },
      ],
      where: { product_id: productId },
    });

    const totalReviews = reviews.length;

    // Tính trung bình rating CHỈ từ reviews có use_for_stats = true (loại meta-reviews)
    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const totalRating = reviewsForStats.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      reviewsForStats.length > 0
        ? (totalRating / reviewsForStats.length).toFixed(2)
        : 0;

    // Sentiment statistics
    const sentimentCount = { POS: 0, NEG: 0, NEU: 0, UNKNOWN: 0 };
    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Suspicious reviews detection
    const suspiciousReviews = [];

    reviews.forEach((r) => {
      // Sentiment count
      if (r.sentiment && sentimentCount.hasOwnProperty(r.sentiment)) {
        sentimentCount[r.sentiment]++;
      } else {
        sentimentCount.UNKNOWN++;
      }

      // Rating distribution
      if (r.rating && ratingDistribution.hasOwnProperty(r.rating)) {
        ratingDistribution[r.rating]++;
      }

      // Detect suspicious: rating vs sentiment mismatch (chỉ từ reviews có use_for_stats = true)
      // 5 sao nhưng sentiment tiêu cực
      if (r.use_for_stats !== false && r.rating >= 4 && r.sentiment === "NEG") {
        suspiciousReviews.push({
          review_id: r.review_id,
          customer: r.Customer?.name || "Ẩn danh",
          rating: r.rating,
          sentiment: r.sentiment,
          content: r.content.substring(0, 80) + "...",
          reason: "Rating cao nhưng nội dung tiêu cực",
          type: "rating_positive_sentiment_negative",
        });
      }

      // 1-2 sao nhưng sentiment tích cực
      if (r.use_for_stats !== false && r.rating <= 2 && r.sentiment === "POS") {
        suspiciousReviews.push({
          review_id: r.review_id,
          customer: r.Customer?.name || "Ẩn danh",
          rating: r.rating,
          sentiment: r.sentiment,
          content: r.content.substring(0, 80) + "...",
          reason: "Rating thấp nhưng nội dung tích cực",
          type: "rating_negative_sentiment_positive",
        });
      }
    });

    return res.status(200).json({
      message: "Tổng quan đánh giá sản phẩm (chi tiết)",
      data: {
        overall: {
          totalReviews,
          avgRating: parseFloat(avgRating),
        },
        sentiment: {
          label: "Phân tích cảm xúc (từ nội dung)",
          POS: sentimentCount.POS,
          NEG: sentimentCount.NEG,
          NEU: sentimentCount.NEU,
          UNKNOWN: sentimentCount.UNKNOWN,
        },
        rating: {
          label: "Đánh giá sao",
          5: ratingDistribution[5],
          4: ratingDistribution[4],
          3: ratingDistribution[3],
          2: ratingDistribution[2],
          1: ratingDistribution[1],
        },
        suspicious: {
          label: "Review khả nghi (mâu thuẫn rating vs nội dung)",
          count: suspiciousReviews.length,
          reviews: suspiciousReviews,
        },
      },
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy tổng quan đánh giá",
      error: error.message,
    });
  }
};

// ADMIN: Lấy tất cả reviews (cho admin dashboard)
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await db.ProductReview.findAll({
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email"],
        },
        {
          model: db.Product,
          attributes: ["product_id", "product_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Lấy danh sách tất cả đánh giá thành công",
      reviews: reviews || [],
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy danh sách đánh giá",
      error: error.message,
    });
  }
};

// ADMIN: Thống kê cảm xúc theo sản phẩm
export const getSentimentStatsByProduct = async (req, res, next) => {
  try {
    const { period = "all" } = req.query; // all, day, week, month

    let whereClause = {};
    const now = new Date();

    if (period === "day") {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      whereClause.created_at = { [db.Sequelize.Op.gte]: oneDayAgo };
    } else if (period === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereClause.created_at = { [db.Sequelize.Op.gte]: oneWeekAgo };
    } else if (period === "month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      whereClause.created_at = { [db.Sequelize.Op.gte]: oneMonthAgo };
    }

    const reviews = await db.ProductReview.findAll({
      where: whereClause,
      include: [
        {
          model: db.Product,
          attributes: ["product_id", "product_name"],
        },
      ],
    });

    // Nhóm theo sản phẩm
    const stats = {};
    reviews.forEach((review) => {
      const productId = review.product_id;
      const productName = review.Product?.product_name || "Unknown";

      if (!stats[productId]) {
        stats[productId] = {
          product_id: productId,
          product_name: productName,
          total_reviews: 0,
          sentiment_count: { POS: 0, NEG: 0, NEU: 0, UNC: 0 },
          sentiment_percentage: { POS: 0, NEG: 0, NEU: 0, UNC: 0 },
          avg_rating: 0,
          total_rating: 0,
          total_rating_count: 0, // Chỉ đếm reviews có use_for_stats = true
        };
      }

      stats[productId].total_reviews += 1;
      stats[productId].sentiment_count[review.sentiment || "NEU"] += 1;

      // Chỉ cộng rating nếu use_for_stats = true (loại meta-reviews)
      if (review.use_for_stats !== false) {
        stats[productId].total_rating += review.rating;
        stats[productId].total_rating_count += 1;
      }
    });

    // Tính phần trăm và rating trung bình
    Object.keys(stats).forEach((productId) => {
      const stat = stats[productId];
      const total = stat.total_reviews;

      stats[productId].sentiment_percentage = {
        POS:
          total > 0 ? Math.round((stat.sentiment_count.POS / total) * 100) : 0,
        NEG:
          total > 0 ? Math.round((stat.sentiment_count.NEG / total) * 100) : 0,
        NEU:
          total > 0 ? Math.round((stat.sentiment_count.NEU / total) * 100) : 0,
        UNC:
          total > 0 ? Math.round((stat.sentiment_count.UNC / total) * 100) : 0,
      };
      // Tính trung bình từ reviews có use_for_stats = true
      stat.avg_rating =
        stat.total_rating_count > 0
          ? (stat.total_rating / stat.total_rating_count).toFixed(2)
          : 0;
      delete stats[productId].total_rating_count; // Loại bỏ field này khỏi response
    });

    const statsArray = Object.values(stats).sort(
      (a, b) => b.total_reviews - a.total_reviews
    );

    return res.status(200).json({
      message: "Lấy thống kê cảm xúc thành công",
      period,
      stats: statsArray,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy thống kê cảm xúc",
      error: error.message,
    });
  }
};

// ADMIN: Lấy reviews bất thường (rating vs sentiment mâu thuẫn)
export const getSuspiciousReviews = async (req, res, next) => {
  try {
    const { type = "all" } = req.query; // all, suspicious, normal

    let whereClause = {};
    if (type === "suspicious") {
      whereClause.is_suspicious = true;
    } else if (type === "normal") {
      whereClause.is_suspicious = false;
    }

    const reviews = await db.ProductReview.findAll({
      where: whereClause,
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email"],
        },
        {
          model: db.Product,
          attributes: ["product_id", "product_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Lấy reviews bất thường thành công",
      type,
      reviews: reviews || [],
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy reviews bất thường",
      error: error.message,
    });
  }
};

// ADMIN: Ẩn/Hiển thị review
export const toggleReviewVisibility = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { is_hidden, hidden_reason } = req.body;

    const review = await db.ProductReview.findByPk(reviewId);
    if (!review) {
      return next({
        statusCode: 404,
        message: "Không tìm thấy review",
      });
    }

    // Validation: Nếu ẩn review, phải có lý do hợp lệ
    if (is_hidden) {
      if (!hidden_reason || !hidden_reason.trim()) {
        return next({
          statusCode: 400,
          message: "Phải nhập lý do khi ẩn review",
        });
      }

      if (!VALID_HIDE_REASON_VALUES.includes(hidden_reason)) {
        return next({
          statusCode: 400,
          message: `Lý do không hợp lệ. Chỉ được ẩn vì vi phạm chính sách:\n- Chửi tục/xúc phạm\n- Spam/quảng cáo\n- Nội dung nhạy cảm\n- Không liên quan\n- Đánh giá giả mạo\n\nCác feedback tiêu cực hợp lệ (hàng xấu, ship lâu, etc) KHÔNG được ẩn.`,
        });
      }

      // ✨ NEW: Gọi NLP service để phân loại feedback (Smart classification với rating)
      try {
        const classificationResponse = await fetch(
          "http://localhost:5001/classify-with-rating",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: review.content,
              rating: review.rating,
            }),
          }
        );

        const classification = await classificationResponse.json();

        // Nếu review là feedback hợp lệ (QUALITY, SERVICE, PRICE) → Từ chối ẩn
        if (!classification.is_policy_violation) {
          return next({
            statusCode: 403,
            message: `❌ Không thể ẩn review này!\n\nPhân loại: ${classification.classification}\nSentiment: ${classification.sentiment}\nRating: ${classification.rating}/5\nMô tả: ${classification.description}\n\n✅ Chỉ được ẩn review vi phạm chính sách (spam, chửi tục, etc).\nFeedback tiêu cực hợp lệ là có giá trị và KHÔNG được ẩn.`,
            classification: classification,
          });
        }
      } catch (nlpError) {
        console.error("NLP Service Error:", nlpError.message);
        // Nếu NLP service lỗi, vẫn cho phép tiếp tục (fallback)
        console.warn(
          "⚠️ NLP service unavailable, skipping classification check"
        );
      }
    }

    review.is_hidden = is_hidden;
    review.hidden_reason = is_hidden ? hidden_reason : null;
    await review.save();

    return res.status(200).json({
      message: is_hidden
        ? "Ẩn review thành công"
        : "Hiển thị review thành công",
      review,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi cập nhật trạng thái review",
      error: error.message,
    });
  }
};

// PUBLIC ENDPOINT - Cho khách hàng (chỉ hiển thị RATING)
export const getReviewSummaryPublic = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const reviews = await db.ProductReview.findAll({
      where: {
        product_id: productId,
        is_hidden: false, // Chỉ lấy review công khai
      },
      attributes: ["rating", "use_for_stats"],
    });

    const totalReviews = reviews.length;

    // Chỉ tính rating từ reviews có use_for_stats = true (loại meta-reviews)
    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const totalRating = reviewsForStats.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      reviewsForStats.length > 0
        ? (totalRating / reviewsForStats.length).toFixed(2)
        : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating && ratingDistribution.hasOwnProperty(r.rating)) {
        ratingDistribution[r.rating]++;
      }
    });

    return res.status(200).json({
      message: "Tổng quan đánh giá sản phẩm (công khai)",
      data: {
        overall: {
          totalReviews,
          avgRating: parseFloat(avgRating),
        },
        rating: {
          label: "Đánh giá sao",
          5: ratingDistribution[5],
          4: ratingDistribution[4],
          3: ratingDistribution[3],
          2: ratingDistribution[2],
          1: ratingDistribution[1],
        },
      },
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy tổng quan đánh giá",
      error: error.message,
    });
  }
};

// PUBLIC ENDPOINT v2 - Cho khách hàng (hiển thị RATING + SENTIMENT + SUSPICIOUS)
export const getReviewSummaryPublicDetailed = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const reviews = await db.ProductReview.findAll({
      include: [
        {
          model: db.Customer,
          attributes: ["name"],
        },
      ],
      where: {
        product_id: productId,
        is_hidden: false,
      },
    });

    const totalReviews = reviews.length;

    // Chỉ tính rating từ reviews có use_for_stats = true (loại meta-reviews)
    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const totalRating = reviewsForStats.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      reviewsForStats.length > 0
        ? (totalRating / reviewsForStats.length).toFixed(2)
        : 0;

    // Sentiment statistics - Initialize with defaults
    const sentimentCount = { POS: 0, NEG: 0, NEU: 0, UNKNOWN: 0 };
    // Rating distribution - Initialize with defaults
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Suspicious reviews detection
    const suspiciousReviews = [];

    reviews.forEach((r) => {
      // Sentiment count
      if (r.sentiment && sentimentCount.hasOwnProperty(r.sentiment)) {
        sentimentCount[r.sentiment]++;
      } else {
        sentimentCount.UNKNOWN++;
      }

      // Rating distribution
      if (r.rating && ratingDistribution.hasOwnProperty(r.rating)) {
        ratingDistribution[r.rating]++;
      }

      // Detect suspicious: rating vs sentiment mismatch (chỉ từ reviews có use_for_stats = true)
      // 5 sao nhưng sentiment tiêu cực
      if (r.use_for_stats !== false && r.rating >= 4 && r.sentiment === "NEG") {
        suspiciousReviews.push({
          review_id: r.review_id,
          customer: r.Customer?.name || "Ẩn danh",
          rating: r.rating,
          sentiment: r.sentiment,
          content: r.content.substring(0, 80) + "...",
          reason: "Rating cao nhưng nội dung tiêu cực",
          type: "rating_positive_sentiment_negative",
          created_at: r.created_at,
        });
      }

      // 1-2 sao nhưng sentiment tích cực
      if (r.use_for_stats !== false && r.rating <= 2 && r.sentiment === "POS") {
        suspiciousReviews.push({
          review_id: r.review_id,
          customer: r.Customer?.name || "Ẩn danh",
          rating: r.rating,
          sentiment: r.sentiment,
          content: r.content.substring(0, 80) + "...",
          reason: "Rating thấp nhưng nội dung tích cực",
          type: "rating_negative_sentiment_positive",
          created_at: r.created_at,
        });
      }
    });

    return res.status(200).json({
      message: "Tổng quan đánh giá sản phẩm (chi tiết công khai)",
      data: {
        overall: {
          totalReviews,
          avgRating: parseFloat(avgRating),
        },
        sentiment: {
          label: "Phân tích cảm xúc (từ nội dung)",
          POS: sentimentCount.POS,
          NEG: sentimentCount.NEG,
          NEU: sentimentCount.NEU,
          UNKNOWN: sentimentCount.UNKNOWN,
        },
        rating: {
          label: "Đánh giá sao",
          5: ratingDistribution[5],
          4: ratingDistribution[4],
          3: ratingDistribution[3],
          2: ratingDistribution[2],
          1: ratingDistribution[1],
        },
        suspicious: {
          label: "Review khả nghi (mâu thuẫn rating vs nội dung)",
          count: suspiciousReviews.length,
          reviews: suspiciousReviews,
        },
      },
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy tổng quan đánh giá",
      error: error.message,
    });
  }
};
