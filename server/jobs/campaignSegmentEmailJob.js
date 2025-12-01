import cron from "node-cron";
import {
  getActiveCampaigns,
  getCustomersBySegment,
  hasPromotionLogSent,
  createPromotionLog,
} from "../utils/promotionHelper.js";
import { sendEmail, formatDate } from "../utils/emailHelper.js";
import { EMAIL_TEMPLATES, CRON_SCHEDULES } from "../config/constants.js";

/**
 * Cron Job B: Campaign Segment Email Job
 * Chạy hằng ngày lúc 09:30 AM
 * Gửi email khuyến mãi theo campaign và segment
 */
const campaignSegmentEmailJob = () => {
  // Schedule: 09:30 AM every day
  cron.schedule(CRON_SCHEDULES.CAMPAIGN_EMAIL, async () => {
    console.log("\n📧 ===== CAMPAIGN SEGMENT EMAIL JOB STARTED =====");
    console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}`);

    try {
      // 1. Lấy các campaign đang active
      const activeCampaigns = await getActiveCampaigns();
      console.log(`📋 Found ${activeCampaigns.length} active campaigns`);

      if (activeCampaigns.length === 0) {
        console.log("✅ No active campaigns. Job completed.");
        return;
      }

      let totalSentCount = 0;
      let totalSkippedCount = 0;
      let totalErrorCount = 0;

      // 2. Xử lý từng campaign
      for (const campaign of activeCampaigns) {
        console.log(
          `\n📦 Processing Campaign: ${campaign.name} (ID: ${campaign.campaign_id})`
        );

        const promotions = campaign.promotions || [];
        console.log(
          `   Found ${promotions.length} promotions in this campaign`
        );

        if (promotions.length === 0) {
          console.log("   ⚠️  No promotions in this campaign. Skipping...");
          continue;
        }

        // 3. Xử lý từng promotion trong campaign
        for (const promotion of promotions) {
          console.log(
            `\n   🎁 Processing Promotion: ${promotion.promotion_code}`
          );
          console.log(
            `      Segment Target: ${promotion.segment_target || "ALL"}`
          );

          let targetCustomers = [];

          // 4. Lọc customers theo segment_target
          if (promotion.segment_target) {
            // Nếu có segment_target cụ thể
            if (
              ["vip", "gold", "silver", "bronze"].includes(
                promotion.segment_target
              )
            ) {
              targetCustomers = await getCustomersBySegment(
                promotion.segment_target
              );
            } else if (promotion.segment_target === "birthday") {
              // Skip birthday promotions (handled by birthdayEmailJob)
              console.log(
                "      ⏭️  Skipping birthday promotion (handled by Birthday Job)"
              );
              continue;
            }
          } else {
            // Nếu segment_target = null, gửi cho tất cả
            const allSegments = ["vip", "gold", "silver", "bronze"];
            for (const segment of allSegments) {
              const customers = await getCustomersBySegment(segment);
              targetCustomers.push(...customers);
            }
          }

          console.log(`      Found ${targetCustomers.length} target customers`);

          if (targetCustomers.length === 0) {
            console.log("      ⚠️  No target customers found. Skipping...");
            continue;
          }

          // 5. Gửi email cho từng customer
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
          const promotionEndDate = campaign?.end_date
            ? formatDate(campaign.end_date)
            : null;

          const htmlContent = EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.getBody(
            customer.name,
            campaign.name,
            promotion.promotion_code,
            promotion.discount,
            promotionEndDate,
            customer.segment_type
          );

            const success = await sendEmail(
              customer.email,
              EMAIL_TEMPLATES.SEGMENT_CAMPAIGN.subject(campaign.name),
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

          console.log(`      📊 Promotion Summary:`);
          console.log(`         ✅ Sent: ${sentCount}`);
          console.log(`         ⏭️  Skipped: ${skippedCount}`);
          console.log(`         ❌ Failed: ${errorCount}`);

          totalSentCount += sentCount;
          totalSkippedCount += skippedCount;
          totalErrorCount += errorCount;
        }
      }

      console.log("\n📊 ===== CAMPAIGN SEGMENT EMAIL JOB SUMMARY =====");
      console.log(`✅ Total emails sent: ${totalSentCount}`);
      console.log(`⏭️  Total emails skipped: ${totalSkippedCount}`);
      console.log(`❌ Total emails failed: ${totalErrorCount}`);
      console.log(
        `🏁 Campaign Segment Email Job completed at ${new Date().toLocaleString(
          "vi-VN"
        )}\n`
      );
    } catch (error) {
      console.error("❌ Campaign Segment Email Job Error:", error);
    }
  });

  console.log(
    `📧 Campaign Segment Email Job scheduled: ${CRON_SCHEDULES.CAMPAIGN_EMAIL} (09:30 AM daily)`
  );
};

export default campaignSegmentEmailJob;
