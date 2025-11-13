import {
  previewRankUpdate,
  runRankUpdateNow,
} from "../jobs/monthlyRankUpdateJob.js";
import db from "../models/index.js";
import { formatVND } from "../utils/emailHelper.js";

const { CustomerRankHistory, Customer } = db;

/**
 * Preview xếp hạng (không commit vào database)
 */
export const previewRank = async (req, res) => {
  try {
    const preview = await previewRankUpdate();

    res.status(200).json({
      success: true,
      message: "Rank preview generated successfully",
      data: preview.map((item) => ({
        ...item,
        total_spent_formatted: formatVND(item.total_spent),
      })),
    });
  } catch (error) {
    console.error("Error previewing rank:", error);
    res.status(500).json({
      success: false,
      message: "Failed to preview rank",
      error: error.message,
    });
  }
};

/**
 * Chạy cập nhật rank ngay lập tức
 */
export const recalculateRank = async (req, res) => {
  try {
    const results = await runRankUpdateNow();

    res.status(200).json({
      success: true,
      message: "Rank recalculation completed successfully",
      updated_count: results.length,
      data: results.map((item) => ({
        ...item,
        total_spent_formatted: formatVND(item.total_spent),
      })),
    });
  } catch (error) {
    console.error("Error recalculating rank:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recalculate rank",
      error: error.message,
    });
  }
};

/**
 * Lấy lịch sử thay đổi rank
 */
export const getRankHistory = async (req, res) => {
  try {
    const { customer_id, period_month, period_year } = req.query;

    const where = {};

    if (customer_id) {
      where.customer_id = customer_id;
    }

    if (period_month) {
      where.period_month = period_month;
    }

    if (period_year) {
      where.period_year = period_year;
    }

    const history = await CustomerRankHistory.findAll({
      where,
      include: [
        {
          model: Customer,
          attributes: ["customer_id", "name", "email", "segment_type"],
        },
      ],
      order: [["changed_at", "DESC"]],
      limit: 500,
    });

    res.status(200).json({
      success: true,
      data: history.map((item) => ({
        ...item.toJSON(),
        total_spent_formatted: formatVND(item.total_spent),
      })),
      count: history.length,
    });
  } catch (error) {
    console.error("Error getting rank history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rank history",
      error: error.message,
    });
  }
};

/**
 * Lấy thống kê phân bố rank hiện tại
 */
export const getRankDistribution = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ["segment_type"],
    });

    const distribution = {
      bronze: 0,
      silver: 0,
      gold: 0,
      vip: 0,
    };

    customers.forEach((customer) => {
      distribution[customer.segment_type]++;
    });

    res.status(200).json({
      success: true,
      data: {
        distribution,
        total: customers.length,
        percentages: {
          bronze:
            ((distribution.bronze / customers.length) * 100).toFixed(2) + "%",
          silver:
            ((distribution.silver / customers.length) * 100).toFixed(2) + "%",
          gold: ((distribution.gold / customers.length) * 100).toFixed(2) + "%",
          vip: ((distribution.vip / customers.length) * 100).toFixed(2) + "%",
        },
      },
    });
  } catch (error) {
    console.error("Error getting rank distribution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rank distribution",
      error: error.message,
    });
  }
};
