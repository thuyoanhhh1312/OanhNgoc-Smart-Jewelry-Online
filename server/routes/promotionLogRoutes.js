import express from "express";
import {
  getAllPromotionLogs,
  sendPromotionManually,
  deletePromotionLogs,
} from "../controllers/promotionLogController.js";

const router = express.Router();

router.get("/", getAllPromotionLogs);
router.post("/send", sendPromotionManually);
router.delete("/", deletePromotionLogs);

export default router;
