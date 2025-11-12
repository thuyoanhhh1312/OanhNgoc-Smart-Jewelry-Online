import {
  getBirthdayCustomers,
  getPromotionsBySegment,
  hasPromotionLogSent,
  createPromotionLog,
} from "../utils/promotionHelper.js";
import { sendEmail, formatDate } from "../utils/emailHelper.js";
import { EMAIL_TEMPLATES, SEGMENT_TARGETS } from "../config/constants.js";

/**
 * Manual trigger for Birthday Email Job
 * Run: node tests/manualTriggerBirthdayJob.js
 */

console.log("\n🎂 ===== MANUAL BIRTHDAY EMAIL JOB TRIGGER =====");
console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}\n`);

async function runBirthdayEmailJob() {
  try {
    // 1. Lấy danh sách customers có sinh nhật hôm nay
    const birthdayCustomers = await getBirthdayCustomers();
    console.log(
      `📋 Found ${birthdayCustomers.length} customers with birthday today`
    );

    if (birthdayCustomers.length === 0) {
      console.log("✅ No birthday customers today. Job completed.");
      process.exit(0);
    }

    // 2. Lấy promotions có segment_target='birthday'
    const birthdayPromotions = await getPromotionsBySegment(
      SEGMENT_TARGETS.BIRTHDAY
    );
    console.log(`🎁 Found ${birthdayPromotions.length} birthday promotions\n`);

    if (birthdayPromotions.length === 0) {
      console.log("⚠️  No birthday promotions available.");
      process.exit(0);
    }

    // 3. Gửi email với mã khuyến mãi
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const customer of birthdayCustomers) {
      console.log(`\n👤 Processing: ${customer.name} (${customer.email})`);

      for (const promotion of birthdayPromotions) {
        // Kiểm tra đã gửi chưa
        const alreadySent = await hasPromotionLogSent(
          customer.customer_id,
          promotion.promotion_id
        );

        if (alreadySent) {
          console.log(
            `   ⏭️  Already sent promotion: ${promotion.promotion_code}`
          );
          skippedCount++;
          continue;
        }

        console.log(`   📧 Sending promotion: ${promotion.promotion_code}`);

        // Gửi email
        const htmlContent = EMAIL_TEMPLATES.BIRTHDAY.getBody(
          customer.name,
          promotion.promotion_code,
          promotion.discount,
          formatDate(promotion.end_date)
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
          console.log(`   ✅ Sent successfully`);
        } else {
          await createPromotionLog(
            customer.customer_id,
            promotion.promotion_id,
            "failed",
            "Email sending failed"
          );
          errorCount++;
          console.log(`   ❌ Failed to send`);
        }

        // Delay để tránh spam
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log("\n📊 ===== BIRTHDAY EMAIL JOB SUMMARY =====");
    console.log(`✅ Emails sent: ${sentCount}`);
    console.log(`⏭️  Emails skipped: ${skippedCount}`);
    console.log(`❌ Emails failed: ${errorCount}`);
    console.log(`🏁 Job completed at ${new Date().toLocaleString("vi-VN")}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Birthday Email Job Error:", error);
    process.exit(1);
  }
}

runBirthdayEmailJob();
