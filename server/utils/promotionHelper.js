import db from "../models/index.js";
import { Op } from "sequelize";

const { PromotionCampaign, Promotion, Customer, PromotionLog, Order } = db;

/**
 * Lấy các campaign đang active
 * @returns {Promise<Array>}
 */
export const getActiveCampaigns = async () => {
  try {
    const now = new Date();

    const campaigns = await PromotionCampaign.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now },
      },
      include: [
        {
          model: Promotion,
          as: "promotions",
          where: {
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now },
          },
          required: false,
        },
      ],
    });

    return campaigns;
  } catch (error) {
    console.error("Error getting active campaigns:", error);
    return [];
  }
};

/**
 * Lấy promotions theo segment target
 * @param {string} segment - Segment type: 'birthday', 'vip', 'gold', 'silver', 'bronze'
 * @returns {Promise<Array>}
 */
export const getPromotionsBySegment = async (segment) => {
  try {
    const now = new Date();

    const promotions = await Promotion.findAll({
      where: {
        segment_target: segment,
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now },
      },
    });

    return promotions;
  } catch (error) {
    console.error("Error getting promotions by segment:", error);
    return [];
  }
};

/**
 * Lấy customers theo segment type
 * @param {string} segmentType - 'vip', 'gold', 'silver', 'bronze'
 * @returns {Promise<Array>}
 */
export const getCustomersBySegment = async (segmentType) => {
  try {
    const customers = await Customer.findAll({
      where: {
        segment_type: segmentType,
      },
    });

    return customers;
  } catch (error) {
    console.error("Error getting customers by segment:", error);
    return [];
  }
};

/**
 * Lấy customers có sinh nhật hôm nay
 * @returns {Promise<Array>}
 */
export const getBirthdayCustomers = async () => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    const customers = await Customer.findAll({
      where: {
        birthday: {
          [Op.ne]: null,
        },
      },
    });

    // Filter by day and month
    return customers.filter((customer) => {
      if (!customer.birthday) return false;
      const birthDate = new Date(customer.birthday);
      return birthDate.getDate() === day && birthDate.getMonth() + 1 === month;
    });
  } catch (error) {
    console.error("Error getting birthday customers:", error);
    return [];
  }
};

/**
 * Kiểm tra xem đã gửi email promotion cho customer chưa
 * @param {number} customerId
 * @param {number} promotionId
 * @returns {Promise<boolean>}
 */
export const hasPromotionLogSent = async (customerId, promotionId) => {
  try {
    const log = await PromotionLog.findOne({
      where: {
        customer_id: customerId,
        promotion_id: promotionId,
      },
    });

    return !!log;
  } catch (error) {
    console.error("Error checking promotion log:", error);
    return false;
  }
};

/**
 * Tạo promotion log sau khi gửi email
 * @param {number} customerId
 * @param {number} promotionId
 * @param {string} emailStatus - 'sent', 'failed'
 * @param {string} errorMessage
 * @returns {Promise<void>}
 */
export const createPromotionLog = async (
  customerId,
  promotionId,
  emailStatus = "sent",
  errorMessage = null
) => {
  try {
    await PromotionLog.create({
      customer_id: customerId,
      promotion_id: promotionId,
      sent_at: new Date(),
      email_status: emailStatus,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error("Error creating promotion log:", error);
  }
};

/**
 * Tính tổng chi tiêu của customer trong tháng hiện tại
 * @param {number} customerId
 * @param {number} month
 * @param {number} year
 * @returns {Promise<number>}
 */
export const getCustomerTotalSpent = async (customerId, month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await Order.sum("total", {
      where: {
        customer_id: customerId,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
        status_id: 3, // Assuming status_id 3 is 'completed'
      },
    });

    return result || 0;
  } catch (error) {
    console.error("Error getting customer total spent:", error);
    return 0;
  }
};
