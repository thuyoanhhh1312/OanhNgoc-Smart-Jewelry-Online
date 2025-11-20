import cron from "node-cron";
import { fetchAndSaveGoldPrices } from "../services/goldPriceService.js";

/**
 * Cron job: Cập nhật giá vàng mỗi giờ
 * "0 * * * *" = mỗi giờ lúc phút 0
 */
export const startGoldPriceCronJob = () => {
  // Chạy mỗi giờ
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Cron job: Kéo giá vàng...");
    await fetchAndSaveGoldPrices("TP.HCM");
    await fetchAndSaveGoldPrices("Hà Nội");
  });

  console.log("✅ Cron job giá vàng đã khởi động (mỗi giờ)");
};
