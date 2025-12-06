import express from "express";
import { authenticateToken, isAdmin } from "../middlewares/auth.js";
import {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController.js";

const router = express.Router();

// ✅ Staff & Admin có thể xem
router.get("/", authenticateToken, getAllCampaigns);
router.get("/:id", authenticateToken, getCampaignById);

// ❌ Chỉ Admin được tạo/sửa/xóa campaign
router.post("/", authenticateToken, isAdmin, createCampaign);
router.put("/:id", authenticateToken, isAdmin, updateCampaign);
router.delete("/:id", authenticateToken, isAdmin, deleteCampaign);

export default router;
