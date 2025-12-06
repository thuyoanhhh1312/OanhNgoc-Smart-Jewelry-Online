import express from "express";
import { authenticateToken, isAdmin } from "../middlewares/auth.js";
import {
  previewRank,
  recalculateRank,
  getRankHistory,
  getRankDistribution,
} from "../controllers/rankController.js";

const router = express.Router();

// ✅ Chỉ Admin được xem & thay đổi rank
router.get("/preview", authenticateToken, isAdmin, previewRank);
router.post("/recalculate", authenticateToken, isAdmin, recalculateRank);
router.get("/history", authenticateToken, isAdmin, getRankHistory);
router.get("/distribution", authenticateToken, isAdmin, getRankDistribution);

export default router;
