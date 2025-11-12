import {
  getActiveCampaigns,
  getCustomersBySegment,
  hasPromotionLogSent,
  createPromotionLog,
} from "../utils/promotionHelper.js";
import { sendEmail, formatDate } from "../utils/emailHelper.js";
import { EMAIL_TEMPLATES } from "../config/constants.js";

/**
 * Manual trigger for Campaign Segment Email Job
 * Run: node tests/manualTriggerCampaignJob.js
 */

console.log("\n📧 ===== MANUAL CAMPAIGN SEGMENT EMAIL JOB TRIGGER =====");
console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}\n`);

async function runCampaignSegmentEmailJob() {
  try {
    // 1. Lấy các campaign đang active
    const activeCampaigns = await getActiveCampaigns();
    console.log(`📋 Found ${activeCampaigns.length} active campaigns\n`);

    if (activeCampaigns.length === 0) {
      console.log("✅ No active campaigns. Job completed.");
      process.exit(0);
    }

    let totalSentCount = 0;
    let totalSkippedCount = 0;
    let totalErrorCount = 0;

    // 2. Xử lý từng campaign
    for (const campaign of activeCampaigns) {
      console.log(
        `\n📦 Campaign: ${campaign.name} (ID: ${campaign.campaign_id})`
      );

      const promotions = campaign.promotions || [];
      console.log(`   Found ${promotions.length} promotions`);

      if (promotions.length === 0) {
        console.log("   ⚠️  No promotions. Skipping...");
        continue;
      }

      // 3. Xử lý từng promotion
      for (const promotion of promotions) {
        console.log(`\n   🎁 Promotion: ${promotion.promotion_code}`);
        console.log(`      Target: ${promotion.segment_target || "ALL"}`);

        let targetCustomers = [];

        // 4. Lọc customers theo segment_target
        if (promotion.segment_target) {
          if (
            ["vip", "gold", "silver", "bronze"].includes(
              promotion.segment_target
            )
          ) {
            targetCustomers = await getCustomersBySegment(
              promotion.segment_target
            );
          } else if (promotion.segment_target === "birthday") {
            console.log("      ⏭️  Birthday promotion (handled separately)");
            continue;
          }
        } else {
          // Gửi cho tất cả
          const allSegments = ["vip", "gold", "silver", "bronze"];
          for (const segment of allSegments) {
            const customers = await getCustomersBySegment(segment);
            targetCustomers.push(...customers);
          }
        }

        console.log(`      Customers: ${targetCustomers.length}`);

        if (targetCustomers.length === 0) {
          console.log("      ⚠️  No customers. Skipping...");
          continue;
        }

        // 5. Gửi email
        let sentCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const customer of targetCustomers) {
          // Kiểm tra đã gửi chưa
          const alreadySent = await hasPromotionLogSent(
            customer.customer_id,
            promotion.promotion_id
          );

          if (alreadySent) {
            skippedCount++;
            continue;
          }

          // Gửi email
          const htmlContent = EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.getBody(
            customer.name,
            campaign.name,
            promotion.promotion_code,
            promotion.discount,
            formatDate(promotion.end_date),
            customer.segment_type
          );

          const success = await sendEmail(
            customer.email,
            EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.subject(campaign.name),
            htmlContent
          );

          if (success) {
            await createPromotionLog(
              customer.customer_id,
              promotion.promotion_id,
              "sent"
            );
            sentCount++;
          } else {
            await createPromotionLog(
              customer.customer_id,
              promotion.promotion_id,
              "failed",
              "Email sending failed"
            );
            errorCount++;
          }

          // Delay
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log(
          `      📊 Sent: ${sentCount} | Skipped: ${skippedCount} | Failed: ${errorCount}`
        );

        totalSentCount += sentCount;
        totalSkippedCount += skippedCount;
        totalErrorCount += errorCount;
      }
    }

    console.log("\n📊 ===== CAMPAIGN SEGMENT EMAIL JOB SUMMARY =====");
    console.log(`✅ Total sent: ${totalSentCount}`);
    console.log(`⏭️  Total skipped: ${totalSkippedCount}`);
    console.log(`❌ Total failed: ${totalErrorCount}`);
    console.log(`🏁 Job completed at ${new Date().toLocaleString("vi-VN")}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Campaign Segment Email Job Error:", error);
    process.exit(1);
  }
}

runCampaignSegmentEmailJob();
