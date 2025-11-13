import db from "../models/index.js";
import { Op } from "sequelize";

const { PromotionCampaign, Promotion } = db;

/**
 * Lấy tất cả campaigns
 */
export const getAllCampaigns = async (req, res) => {
  try {
    const { is_active, search } = req.query;

    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === "true";
    }

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const campaigns = await PromotionCampaign.findAll({
      where,
      include: [
        {
          model: Promotion,
          as: "promotions",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Error getting campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get campaigns",
      error: error.message,
    });
  }
};

/**
 * Lấy campaign theo ID
 */
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await PromotionCampaign.findByPk(id, {
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

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("Error getting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get campaign",
      error: error.message,
    });
  }
};

/**
 * Tạo campaign mới
 */
export const createCampaign = async (req, res) => {
  try {
    const { name, description, start_date, end_date, is_active } = req.body;

    // Validation
    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Name, start_date, and end_date are required",
      });
    }

    const campaign = await PromotionCampaign.create({
      name,
      description,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
};

/**
 * Cập nhật campaign
 */
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, is_active } = req.body;

    const campaign = await PromotionCampaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.update({
      name: name || campaign.name,
      description:
        description !== undefined ? description : campaign.description,
      start_date: start_date || campaign.start_date,
      end_date: end_date || campaign.end_date,
      is_active: is_active !== undefined ? is_active : campaign.is_active,
    });

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message,
    });
  }
};

/**
 * Xóa campaign
 */
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await PromotionCampaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await campaign.destroy();

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message,
    });
  }
};
