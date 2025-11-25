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

export const createReview = async (req, res, next) => {
  const productId = req.params.id;
  const { user_id, rating, content } = req.body;

  const customer = await db.Customer.findOne({
    where: { user_id },
  });

  const customer_id = customer.customer_id;

  if (!customer_id || !rating || !content) {
    return next({
      statusCode: 400,
      message:
        "Thiếu dữ liệu bắt buộc: customer_id, rating hoặc nội dung đánh giá",
    });
  }

  try {
    // Gọi API sentiment để phân tích nội dung

    let sentiment = null;
    let sentimentConfidence = 0;
    let isMetaReview = false;
    let metaConfidence = 0;
    let useForStats = true;

    try {
      const sentimentRes = await axios.post(
        "http://localhost:5001/sentiment",
        { text: content },
        { timeout: 5000 }
      );

      console.log(
        `📨 Sentiment API Response:`,
        JSON.stringify(sentimentRes.data, null, 2)
      );

      sentiment =
        sentimentRes.data.label_code || sentimentRes.data.label || null;
      sentimentConfidence =
        sentimentRes.data.confidence !== null &&
        sentimentRes.data.confidence !== undefined
          ? sentimentRes.data.confidence
          : 0;
      isMetaReview = sentimentRes.data.is_meta_review || false;
      metaConfidence = sentimentRes.data.meta_confidence || 0;
      useForStats = sentimentRes.data.use_for_stats !== false; // Mặc định true, chỉ false nếu meta-review

      console.log(`✅ Sentiment Analysis:`, {
        sentiment,
        confidence: sentimentConfidence,
        is_meta: isMetaReview,
        meta_confidence: metaConfidence,
        use_for_stats: useForStats,
      });
    } catch (sentimentErr) {
      console.error("Error analyzing sentiment:", sentimentErr.message);
      sentiment = null;
      sentimentConfidence = 0;
    }

    const newReview = await db.ProductReview.create({
      product_id: productId,
      customer_id,
      rating,
      content,
      sentiment,
      sentiment_confidence: sentimentConfidence,
      is_meta_review: isMetaReview,
      meta_confidence: metaConfidence,
      use_for_stats: useForStats,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({
      message: "Tạo đánh giá thành công",
      review: newReview,
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
