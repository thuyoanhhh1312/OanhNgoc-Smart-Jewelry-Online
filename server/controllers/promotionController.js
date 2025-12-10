import db from "../models/index.js";

// Lấy tất cả khuyến mãi kèm số lượt đã dùng và giới hạn
export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await db.Promotion.findAll({
      attributes: [
        "promotion_id",
        "promotion_code",
        "campaign_id",
        "segment_target",
        "discount",
        "description",
        "usage_limit",
        "usage_count",
      ],
      include: [
        {
          model: db.PromotionCampaign,
          as: "campaign",
          attributes: ["campaign_id", "name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(promotions);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách khuyến mãi",
      error: error.message,
    });
  }
};

// Lấy danh sách khuyến mãi cho khách hàng (bao gồm khuyến mãi cho tất cả + khuyến mãi riêng)
export const getCustomerPromotions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để xem khuyến mãi" });
    }

    // Tìm customer_id từ userId
    const customer = await db.Customer.findOne({ 
      where: { user_id: userId },
      attributes: ["customer_id"]
    });

    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
    }

    const customerId = customer.customer_id;

    // 1. Lấy khuyến mãi cho tất cả (segment_target = null hoặc không có trong promotion_logs)
    const publicPromotions = await db.Promotion.findAll({
      where: { 
        segment_target: null 
      },
      attributes: [
        "promotion_id",
        "promotion_code",
        "campaign_id",
        "segment_target",
        "discount",
        "description",
        "usage_limit",
        "usage_count",
      ],
      include: [
        {
          model: db.PromotionCampaign,
          as: "campaign",
          attributes: ["campaign_id", "name", "start_date", "end_date"],
          required: false,
        },
      ],
    });

    // 2. Lấy khuyến mãi được gửi riêng cho khách hàng từ promotion_logs
    const promotionLogs = await db.PromotionLog.findAll({
      where: { customer_id: customerId },
      attributes: ["promotion_id"],
    });

    const privatePromotionIds = promotionLogs.map(log => log.promotion_id);

    let privatePromotions = [];
    if (privatePromotionIds.length > 0) {
      privatePromotions = await db.Promotion.findAll({
        where: { promotion_id: privatePromotionIds },
        attributes: [
          "promotion_id",
          "promotion_code",
          "campaign_id",
          "segment_target",
          "discount",
          "description",
          "usage_limit",
          "usage_count",
        ],
        include: [
          {
            model: db.PromotionCampaign,
            as: "campaign",
            attributes: ["campaign_id", "name", "start_date", "end_date"],
            required: false,
          },
        ],
      });
    }

    // 3. Gộp 2 danh sách và loại bỏ trùng lặp
    const allPromotionIds = new Set();
    const combinedPromotions = [];

    // Thêm khuyến mãi riêng trước
    privatePromotions.forEach(promo => {
      allPromotionIds.add(promo.promotion_id);
      combinedPromotions.push(promo);
    });

    // Thêm khuyến mãi công khai (nếu chưa có)
    publicPromotions.forEach(promo => {
      if (!allPromotionIds.has(promo.promotion_id)) {
        combinedPromotions.push(promo);
      }
    });

    // Sắp xếp theo created_at
    combinedPromotions.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.status(200).json(combinedPromotions);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách khuyến mãi",
      error: error.message,
    });
  }
};

// Lấy chi tiết khuyến mãi theo id
export const getPromotionById = async (req, res) => {
  const { id } = req.params;
  try {
    const promotion = await db.Promotion.findByPk(id, {
      attributes: [
        "promotion_id",
        "promotion_code",
        "discount",
        "description",
        "usage_limit",
        "usage_count",
      ],
    });
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" });
    }
    res.status(200).json(promotion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy khuyến mãi", error: error.message });
  }
};

// Tạo khuyến mãi mới
export const createPromotion = async (req, res) => {
  const {
    promotion_code,
    campaign_id,
    segment_target,
    discount,
    description,
    usage_limit,
  } = req.body;

  // Validate usage_limit (nếu có) phải là số nguyên >= 0 hoặc null
  if (usage_limit !== undefined && usage_limit !== null) {
    if (!Number.isInteger(usage_limit) || usage_limit < 0) {
      return res.status(400).json({
        message: "usage_limit phải là số nguyên lớn hơn hoặc bằng 0 hoặc null.",
      });
    }
  }

  try {
    const newPromotion = await db.Promotion.create({
      promotion_code,
      campaign_id: campaign_id || null,
      segment_target: segment_target || null,
      discount,
      description,
      usage_limit: usage_limit ?? null,
      usage_count: 0,
    });
    res.status(201).json(newPromotion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo khuyến mãi", error: error.message });
  }
};

// Cập nhật khuyến mãi
export const updatePromotion = async (req, res) => {
  const { id } = req.params;
  const {
    promotion_code,
    campaign_id,
    segment_target,
    discount,
    description,
    usage_limit,
  } = req.body;

  if (usage_limit !== undefined && usage_limit !== null) {
    if (!Number.isInteger(usage_limit) || usage_limit < 0) {
      return res.status(400).json({
        message: "usage_limit phải là số nguyên lớn hơn hoặc bằng 0 hoặc null.",
      });
    }
  }

  try {
    const promotion = await db.Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" });
    }

    promotion.promotion_code = promotion_code ?? promotion.promotion_code;
    promotion.campaign_id =
      campaign_id !== undefined ? campaign_id : promotion.campaign_id;
    promotion.segment_target =
      segment_target !== undefined ? segment_target : promotion.segment_target;
    promotion.discount = discount ?? promotion.discount;
    promotion.description = description ?? promotion.description;

    // Nếu cập nhật usage_limit thì chỉ cho update khi usage_count <= usage_limit mới hợp lệ
    if (usage_limit !== undefined) {
      if (usage_limit !== null && usage_limit < promotion.usage_count) {
        return res.status(400).json({
          message: `usage_limit không thể nhỏ hơn số lượt đã dùng hiện tại (${promotion.usage_count}).`,
        });
      }
      promotion.usage_limit = usage_limit;
    }

    await promotion.save();
    res.status(200).json(promotion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật khuyến mãi", error: error.message });
  }
};

// Xóa khuyến mãi
export const deletePromotion = async (req, res) => {
  const { id } = req.params;
  try {
    const promotion = await db.Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tìm thấy" });
    }
    await promotion.destroy();
    res.status(200).json({ message: "Khuyến mãi đã được xóa thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa khuyến mãi", error: error.message });
  }
};
