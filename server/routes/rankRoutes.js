import express from "express";
import {
  previewRank,
  recalculateRank,
  getRankHistory,
  getRankDistribution,
} from "../controllers/rankController.js";

const router = express.Router();

router.get("/preview", previewRank);
router.post("/recalculate", recalculateRank);
router.get("/history", getRankHistory);
router.get("/distribution", getRankDistribution);

export default router;
