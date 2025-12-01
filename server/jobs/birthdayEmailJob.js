import cron from "node-cron";
import {
  getBirthdayCustomers,
  getPromotionsBySegment,
  hasPromotionLogSent,
  createPromotionLog,
} from "../utils/promotionHelper.js";
import { sendEmail } from "../utils/emailHelper.js";
import {
  EMAIL_TEMPLATES,
  SEGMENT_TARGETS,
  CRON_SCHEDULES,
} from "../config/constants.js";

/**
 * Cron Job A: Birthday Email Job
 * Chạy hằng ngày lúc 09:00 AM
 * Gửi email chúc mừng sinh nhật cho khách hàng có sinh nhật hôm nay
 */
const birthdayEmailJob = () => {
  // Schedule: 09:00 AM every day
  cron.schedule(CRON_SCHEDULES.BIRTHDAY_EMAIL, async () => {
    console.log("\n🎂 ===== BIRTHDAY EMAIL JOB STARTED =====");
    console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}`);

    try {
      // 1. Lấy danh sách customers có sinh nhật hôm nay
      const birthdayCustomers = await getBirthdayCustomers();
      console.log(
        `📋 Found ${birthdayCustomers.length} customers with birthday today`
      );

      if (birthdayCustomers.length === 0) {
        console.log("✅ No birthday customers today. Job completed.");
        return;
      }

      // 2. Lấy promotions có segment_target='birthday'
      const birthdayPromotions = await getPromotionsBySegment(
        SEGMENT_TARGETS.BIRTHDAY
      );
      console.log(`🎁 Found ${birthdayPromotions.length} birthday promotions`);

      if (birthdayPromotions.length === 0) {
        console.log(
          "⚠️  No birthday promotions available. Sending general birthday wishes..."
        );

        // Gửi email chúc mừng sinh nhật không có mã khuyến mãi
        for (const customer of birthdayCustomers) {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #d4af37; text-align: center;">🎂 Chúc mừng sinh nhật!</h2>
              <p>Kính gửi <strong>${customer.name}</strong>,</p>
              <p>Nhân dịp sinh nhật của bạn, <strong>OanhNgoc Smart Jewelry</strong> xin gửi tới bạn những lời chúc tốt đẹp nhất!</p>
              <p>Chúc bạn luôn khỏe mạnh, hạnh phúc và thành công!</p>
              <p style="margin-top: 30px;">Trân trọng,<br/><strong>OanhNgoc Jewelry Team</strong></p>
            </div>
          `;

          await sendEmail(
            customer.email,
            EMAIL_TEMPLATES.BIRTHDAY.subject,
            htmlContent
          );
        }

        console.log("✅ General birthday emails sent successfully.");
        return;
      }

      // 3. Gửi email với mã khuyến mãi
      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const customer of birthdayCustomers) {
        for (const promotion of birthdayPromotions) {
          // Kiểm tra đã gửi chưa
          const alreadySent = await hasPromotionLogSent(
            customer.customer_id,
            promotion.promotion_id
          );

          if (alreadySent) {
            console.log(
              `⏭️  Skipped: Email already sent to ${customer.email} for promotion ${promotion.promotion_code}`
            );
            skippedCount++;
            continue;
          }

          // Gửi email
          const htmlContent = EMAIL_TEMPLATES.BIRTHDAY.getBody(
            customer.name,
            promotion.promotion_code,
            promotion.discount,
            null
          );

          const success = await sendEmail(
            customer.email,
            EMAIL_TEMPLATES.BIRTHDAY.subject,
            htmlContent
          );

          if (success) {
            // Ghi log
            await createPromotionLog(
              customer.customer_id,
              promotion.promotion_id,
              "sent"
            );
            sentCount++;
            console.log(
              `✅ Sent birthday email to ${customer.email} with promotion ${promotion.promotion_code}`
            );
          } else {
            await createPromotionLog(
              customer.customer_id,
              promotion.promotion_id,
              "failed",
              "Email sending failed"
            );
            errorCount++;
          }

          // Delay để tránh spam (100ms giữa mỗi email)
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log("\n📊 ===== BIRTHDAY EMAIL JOB SUMMARY =====");
      console.log(`✅ Emails sent: ${sentCount}`);
      console.log(`⏭️  Emails skipped (already sent): ${skippedCount}`);
      console.log(`❌ Emails failed: ${errorCount}`);
      console.log(
        `🏁 Birthday Email Job completed at ${new Date().toLocaleString(
          "vi-VN"
        )}\n`
      );
    } catch (error) {
      console.error("❌ Birthday Email Job Error:", error);
    }
  });

  console.log(
    `🎂 Birthday Email Job scheduled: ${CRON_SCHEDULES.BIRTHDAY_EMAIL} (09:00 AM daily)`
  );
};

export default birthdayEmailJob;
