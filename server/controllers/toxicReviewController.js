import db from "../models/index.js";

/**
 * Admin Toxic Review Management Controller
 * Quản lý duyệt, chấp nhận hoặc từ chối các review có nội dung toxic
 */

// Lấy danh sách toxic reviews cần duyệt
export const getToxicReviewsPending = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = "pending" } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.ProductReview.findAndCountAll({
      where: {
        needs_admin_review: true,
        admin_review_status: status, // "pending", "approved", "rejected"
      },
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
        {
          model: db.Product,
          attributes: ["name", "id"],
        },
      ],
      order: [["created_at", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    return res.status(200).json({
      message: "Lấy danh sách toxic reviews thành công",
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      reviews: rows,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy danh sách toxic reviews",
      error: err.message,
    });
  }
};

// Lấy chi tiết một toxic review
export const getToxicReviewDetail = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await db.ProductReview.findByPk(reviewId, {
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone", "user_id"],
        },
        {
          model: db.Product,
          attributes: ["name", "id", "price"],
        },
      ],
    });

    if (!review) {
      return next({
        statusCode: 404,
        message: "Review không tồn tại",
      });
    }

    return res.status(200).json({
      message: "Lấy chi tiết review thành công",
      review,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy chi tiết review",
      error: err.message,
    });
  }
};

// Admin chấp nhận review (không toxic hoặc accept lên công khai)
export const approveToxicReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { note = "" } = req.body;
    const adminId = req.user?.id; // From auth middleware

    const review = await db.ProductReview.findByPk(reviewId);

    if (!review) {
      return next({
        statusCode: 404,
        message: "Review không tồn tại",
      });
    }

    // Update review status
    await review.update({
      admin_review_status: "approved",
      admin_review_note: note,
      reviewed_by: adminId,
      is_hidden: false, // Công khai review
      updated_at: new Date(),
    });

    return res.status(200).json({
      message: "Review đã được duyệt và công khai",
      review,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi duyệt review",
      error: err.message,
    });
  }
};

// Admin từ chối review (xóa khỏi công khai)
export const rejectToxicReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { note = "Nội dung không phù hợp" } = req.body;
    const adminId = req.user?.id; // From auth middleware

    const review = await db.ProductReview.findByPk(reviewId);

    if (!review) {
      return next({
        statusCode: 404,
        message: "Review không tồn tại",
      });
    }

    // Update review status
    await review.update({
      admin_review_status: "rejected",
      admin_review_note: note,
      reviewed_by: adminId,
      is_hidden: true, // Ẩn review
      hidden_reason: "ADMIN_TOXIC_REJECTION",
      updated_at: new Date(),
    });

    return res.status(200).json({
      message: "Review đã bị từ chối và ẩn khỏi công khai",
      review,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi từ chối review",
      error: err.message,
    });
  }
};

// Lấy thống kê toxic reviews
export const getToxicReviewStats = async (req, res, next) => {
  try {
    // Tổng số toxic reviews cần duyệt
    const pendingCount = await db.ProductReview.count({
      where: {
        needs_admin_review: true,
        admin_review_status: "pending",
      },
    });

    // Tổng số toxic reviews đã duyệt
    const approvedCount = await db.ProductReview.count({
      where: {
        admin_review_status: "approved",
      },
    });

    // Tổng số toxic reviews bị từ chối
    const rejectedCount = await db.ProductReview.count({
      where: {
        admin_review_status: "rejected",
      },
    });

    // Phân loại toxic type thường gặp nhất
    const toxicTypeStats = await db.ProductReview.findAll({
      where: {
        is_toxic: true,
      },
      attributes: ["toxic_types"],
      raw: true,
    });

    // Tính toán toxic types distribution
    const typesMap = {};
    toxicTypeStats.forEach((review) => {
      if (review.toxic_types && Array.isArray(review.toxic_types)) {
        review.toxic_types.forEach((type) => {
          typesMap[type] = (typesMap[type] || 0) + 1;
        });
      }
    });

    // Sắp xếp từ cao xuống thấp
    const sortedTypes = Object.entries(typesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10

    return res.status(200).json({
      message: "Lấy thống kê toxic reviews thành công",
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
        toxicTypeDistribution: Object.fromEntries(sortedTypes),
      },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy thống kê toxic reviews",
      error: err.message,
    });
  }
};

// Lấy danh sách reviews theo toxic_score cao
export const getToxicReviewsByHighestScore = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const reviews = await db.ProductReview.findAll({
      where: {
        is_toxic: true,
      },
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email"],
        },
        {
          model: db.Product,
          attributes: ["name", "id"],
        },
      ],
      order: [["toxic_score", "DESC"]],
      limit: parseInt(limit),
    });

    return res.status(200).json({
      message: "Lấy danh sách toxic reviews theo điểm cao nhất",
      reviews,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi lấy danh sách toxic reviews",
      error: err.message,
    });
  }
};

// Bulk update: Duyệt/Từ chối nhiều reviews cùng lúc
export const bulkUpdateToxicReviews = async (req, res, next) => {
  try {
    const { reviewIds = [], action = "approve", note = "" } = req.body;
    const adminId = req.user?.id;

    if (!reviewIds.length) {
      return next({
        statusCode: 400,
        message: "Vui lòng chọn ít nhất một review",
      });
    }

    const updateData = {
      admin_review_note: note,
      reviewed_by: adminId,
      updated_at: new Date(),
    };

    if (action === "approve") {
      updateData.admin_review_status = "approved";
      updateData.is_hidden = false;
    } else if (action === "reject") {
      updateData.admin_review_status = "rejected";
      updateData.is_hidden = true;
      updateData.hidden_reason = "ADMIN_TOXIC_REJECTION";
    }

    const result = await db.ProductReview.update(updateData, {
      where: {
        review_id: reviewIds,
      },
    });

    return res.status(200).json({
      message: `Đã cập nhật ${result[0]} reviews`,
      updatedCount: result[0],
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi cập nhật bulk reviews",
      error: err.message,
    });
  }
};
