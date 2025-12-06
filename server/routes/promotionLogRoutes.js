import express from "express";
import {
  authenticateToken,
  isAdmin,
  isAdminOrStaff,
} from "../middlewares/auth.js";
import {
  getAllPromotionLogs,
  sendPromotionManually,
  deletePromotionLogs,
} from "../controllers/promotionLogController.js";

const router = express.Router();

// ✅ Staff & Admin xem & gửi email
router.get("/", authenticateToken, isAdminOrStaff, getAllPromotionLogs);
router.post("/send", authenticateToken, isAdminOrStaff, sendPromotionManually);

// ❌ Chỉ Admin xóa
router.delete("/", authenticateToken, isAdmin, deletePromotionLogs);

export default router;
