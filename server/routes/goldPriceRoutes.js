import express from "express";
import {
  getGoldPrices,
  updateGoldPriceController,
  fetchGoldPrices,
  deleteGoldPrice,
} from "../controllers/goldPriceController.js";

const router = express.Router();

// Public API
router.get("/", getGoldPrices);

// Admin API (cần middleware auth)
router.post("/", updateGoldPriceController);
router.post("/fetch", fetchGoldPrices); // Kéo từ PNJ
router.delete("/:id", deleteGoldPrice);

export default router;
