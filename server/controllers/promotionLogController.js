import db from "../models/index.js";
import { Op } from "sequelize";
import {
  getPromotionsBySegment,
  getCustomersBySegment,
  hasPromotionLogSent,
  createPromotionLog,
} from "../utils/promotionHelper.js";
import { sendEmail } from "../utils/emailHelper.js";
import { EMAIL_TEMPLATES } from "../config/constants.js";

const { PromotionLog, Customer, Promotion, PromotionCampaign } = db;

/**
 * Lấy tất cả promotion logs
 */
export const getAllPromotionLogs = async (req, res) => {
  try {
    const {
      campaign_id,
      promotion_id,
      customer_id,
      start_date,
      end_date,
      email_status,
    } = req.query;

    const where = {};

    if (customer_id) {
      const cid = parseInt(customer_id);
      if (!isNaN(cid)) where.customer_id = cid;
    }

    if (promotion_id) {
      const pid = parseInt(promotion_id);
      if (!isNaN(pid)) where.promotion_id = pid;
    }

    if (email_status) {
      where.email_status = email_status;
    }

    if (start_date && end_date) {
      where.sent_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    let include = [
      {
        model: Customer,
        attributes: ["customer_id", "name", "email", "segment_type"],
        required: false,
      },
      {
        model: Promotion,
        attributes: [
          "promotion_id",
          "promotion_code",
          "discount",
          "segment_target",
          "campaign_id",
        ],
        required: false,
      },
    ];

    // Filter by campaign_id if provided
    if (campaign_id) {
      const campaignId = parseInt(campaign_id);
      if (!isNaN(campaignId)) {
        // Add where condition to Promotion include
        include[1] = {
          ...include[1],
          where: { campaign_id: campaignId },
          required: true,
        };
      }
    }

    const logs = await PromotionLog.findAll({
      where,
      include,
      order: [["log_id", "DESC"]],
      limit: 1000,
      subQuery: false,
    });

    res.status(200).json({
      success: true,
      data: logs || [],
      count: logs?.length || 0,
    });
  } catch (error) {
    console.error("Error getting promotion logs:", error.message);
    console.error("Stack:", error.stack);

    // Return empty array as fallback
    res.status(200).json({
      success: true,
      data: [],
      count: 0,
    });
  }
};

/**
 * Gửi promotion email thủ công
 */
export const sendPromotionManually = async (req, res) => {
  try {
    const { campaign_id, promotion_id, customer_ids, force_resend } = req.body;

    if (!promotion_id && !campaign_id) {
      return res.status(400).json({
        success: false,
        message: "Either promotion_id or campaign_id is required",
      });
    }

    let targetPromotions = [];

    // Lấy danh sách promotions cần gửi
    if (promotion_id) {
      const promotion = await Promotion.findByPk(promotion_id);
      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: "Promotion not found",
        });
      }
      targetPromotions.push(promotion);
    } else if (campaign_id) {
      const campaign = await PromotionCampaign.findByPk(campaign_id, {
        include: [
          {
            model: Promotion,
            as: "promotions",
          },
        ],
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      targetPromotions = campaign.promotions || [];
    }

    if (targetPromotions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No promotions found to send",
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Xử lý từng promotion
    for (const promotion of targetPromotions) {
      let targetCustomers = [];

      // Lấy danh sách customers
      if (customer_ids && customer_ids.length > 0) {
        // Gửi cho các customer được chỉ định
        targetCustomers = await Customer.findAll({
          where: {
            customer_id: { [Op.in]: customer_ids },
          },
        });
      } else if (promotion.segment_target) {
        // Gửi theo segment_target
        if (
          ["vip", "gold", "silver", "bronze"].includes(promotion.segment_target)
        ) {
          targetCustomers = await getCustomersBySegment(
            promotion.segment_target
          );
        }
      } else {
        // Gửi cho tất cả customers
        const allSegments = ["vip", "gold", "silver", "bronze"];
        for (const segment of allSegments) {
          const customers = await getCustomersBySegment(segment);
          targetCustomers.push(...customers);
        }
      }

      // Gửi email
      for (const customer of targetCustomers) {
        // Kiểm tra đã gửi chưa (nếu không force_resend)
        if (!force_resend) {
          const alreadySent = await hasPromotionLogSent(
            customer.customer_id,
            promotion.promotion_id
          );
          if (alreadySent) {
            skippedCount++;
            continue;
          }
        }

        // Gửi email
        const htmlContent = EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.getBody(
          customer.name,
          promotion.promotion_code,
          promotion.promotion_code,
          promotion.discount,
          null,
          customer.segment_type
        );

        const success = await sendEmail(
          customer.email,
          EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.subject(promotion.promotion_code),
          htmlContent
        );

        if (success) {
          await createPromotionLog(
            customer.customer_id,
            promotion.promotion_id,
            "sent"
          );
          sentCount++;
        } else {
          await createPromotionLog(
            customer.customer_id,
            promotion.promotion_id,
            "failed",
            "Email sending failed"
          );
          errorCount++;
        }

        // Delay để tránh spam
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    res.status(200).json({
      success: true,
      message: "Manual promotion sending completed",
      summary: {
        sent: sentCount,
        skipped: skippedCount,
        failed: errorCount,
      },
    });
  } catch (error) {
    console.error("Error sending promotion manually:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send promotion manually",
      error: error.message,
    });
  }
};

/**
 * Xóa promotion logs (admin only)
 */
export const deletePromotionLogs = async (req, res) => {
  try {
    const { log_ids } = req.body;

    if (!log_ids || !Array.isArray(log_ids) || log_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "log_ids array is required",
      });
    }

    const deleted = await PromotionLog.destroy({
      where: {
        log_id: { [Op.in]: log_ids },
      },
    });

    res.status(200).json({
      success: true,
      message: `${deleted} promotion logs deleted successfully`,
      deleted_count: deleted,
    });
  } catch (error) {
    console.error("Error deleting promotion logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete promotion logs",
      error: error.message,
    });
  }
};
