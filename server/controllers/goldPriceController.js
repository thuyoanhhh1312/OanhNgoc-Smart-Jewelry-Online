import db from "../models/index.js";
import {
  fetchAndSaveGoldPrices,
  updateGoldPrice,
} from "../services/goldPriceService.js";

const { GoldPrice } = db;

/**
 * GET /api/gold-prices
 * Lấy danh sách giá vàng hiện tại
 */
export const getGoldPrices = async (req, res, next) => {
  try {
    const { location = "TP.HCM", source } = req.query;

    const where = { location };
    if (source) where.source = source;

    const prices = await GoldPrice.findAll({
      where,
      order: [["updated_at", "DESC"]],
    });

    res.json({
      success: true,
      data: prices,
      meta: {
        count: prices.length,
        location,
        source: source || "all",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/gold-prices
 * Tạo/cập nhật giá vàng
 * Admin use
 */
export const updateGoldPriceController = async (req, res, next) => {
  try {
    const result = await updateGoldPrice(req.body);
    res.json({
      success: true,
      message: "Cập nhật giá vàng thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/gold-prices/fetch
 * Kéo giá vàng từ PNJ
 * Chỉ Admin
 */
export const fetchGoldPrices = async (req, res, next) => {
  try {
    const { location = "TP.HCM" } = req.body;

    const prices = await fetchAndSaveGoldPrices(location);

    res.json({
      success: true,
      message: "Kéo giá vàng thành công",
      data: prices,
      count: prices.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/gold-prices/:id
 * Xóa giá vàng
 */
export const deleteGoldPrice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await GoldPrice.destroy({
      where: { gold_price_id: id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giá vàng",
      });
    }

    res.json({
      success: true,
      message: "Xóa giá vàng thành công",
    });
  } catch (error) {
    next(error);
  }
};
