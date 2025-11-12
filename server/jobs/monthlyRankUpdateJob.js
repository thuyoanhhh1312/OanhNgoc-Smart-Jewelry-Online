import cron from "node-cron";
import db from "../models/index.js";
import { getCustomerTotalSpent } from "../utils/promotionHelper.js";
import {
  sendEmail,
  formatVND,
  getCurrentPeriod,
} from "../utils/emailHelper.js";
import {
  RANK_THRESHOLDS,
  EMAIL_TEMPLATES,
  CRON_SCHEDULES,
} from "../config/constants.js";

const { Customer, CustomerRankHistory } = db;

/**
 * Xác định rank dựa trên tổng chi tiêu
 * @param {number} totalSpent
 * @returns {string} - 'bronze', 'silver', 'gold', 'vip'
 */
const determineRank = (totalSpent) => {
  if (totalSpent > RANK_THRESHOLDS.VIP) {
    return "vip";
  } else if (totalSpent > RANK_THRESHOLDS.GOLD) {
    return "gold";
  } else if (totalSpent > RANK_THRESHOLDS.SILVER) {
    return "silver";
  } else {
    return "bronze";
  }
};

/**
 * Cron Job C: Monthly Rank Update Job
 * Chạy hằng ngày lúc 11:55 PM
 * Tính toán và cập nhật xếp hạng khách hàng dựa trên tổng chi tiêu tháng hiện tại
 */
const monthlyRankUpdateJob = () => {
  // Schedule: 11:55 PM every day
  cron.schedule(CRON_SCHEDULES.RANK_UPDATE, async () => {
    console.log("\n💎 ===== MONTHLY RANK UPDATE JOB STARTED =====");
    console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}`);

    try {
      const { month, year } = getCurrentPeriod();
      console.log(`📅 Period: ${month}/${year}`);

      // 1. Lấy tất cả customers
      const customers = await Customer.findAll();
      console.log(`👥 Found ${customers.length} customers`);

      if (customers.length === 0) {
        console.log("✅ No customers to process. Job completed.");
        return;
      }

      let updatedCount = 0;
      let unchangedCount = 0;
      let upgradedCount = 0;
      let downgradedCount = 0;

      // 2. Xử lý từng customer
      for (const customer of customers) {
        try {
          // Tính tổng chi tiêu tháng hiện tại
          const totalSpent = await getCustomerTotalSpent(
            customer.customer_id,
            month,
            year
          );

          // Xác định rank mới
          const newRank = determineRank(totalSpent);
          const oldRank = customer.segment_type;

          // Kiểm tra có thay đổi rank không
          if (newRank !== oldRank) {
            console.log(`\n📊 Customer: ${customer.name} (${customer.email})`);
            console.log(`   Old Rank: ${oldRank.toUpperCase()}`);
            console.log(`   New Rank: ${newRank.toUpperCase()}`);
            console.log(`   Total Spent: ${formatVND(totalSpent)}`);

            // Cập nhật rank trong bảng customer
            await customer.update({ segment_type: newRank });

            // Lưu lịch sử thay đổi rank
            await CustomerRankHistory.create({
              customer_id: customer.customer_id,
              old_rank: oldRank,
              new_rank: newRank,
              total_spent: totalSpent,
              changed_at: new Date(),
              period_month: month,
              period_year: year,
            });

            updatedCount++;

            // Xác định thăng hạng hay hạ hạng
            const rankOrder = { bronze: 1, silver: 2, gold: 3, vip: 4 };
            if (rankOrder[newRank] > rankOrder[oldRank]) {
              upgradedCount++;

              // Gửi email chúc mừng thăng hạng
              const htmlContent = EMAIL_TEMPLATES.RANK_UPGRADE.getBody(
                customer.name,
                oldRank,
                newRank,
                formatVND(totalSpent)
              );

              const emailSent = await sendEmail(
                customer.email,
                EMAIL_TEMPLATES.RANK_UPGRADE.subject(newRank),
                htmlContent
              );

              if (emailSent) {
                console.log(`   ✅ Upgrade email sent to ${customer.email}`);
              } else {
                console.log(
                  `   ❌ Failed to send upgrade email to ${customer.email}`
                );
              }
            } else {
              downgradedCount++;
              console.log(`   ⬇️  Customer downgraded (no email sent)`);
            }

            // Delay để tránh spam (100ms giữa mỗi customer)
            await new Promise((resolve) => setTimeout(resolve, 100));
          } else {
            unchangedCount++;
          }
        } catch (error) {
          console.error(
            `❌ Error processing customer ${customer.customer_id}:`,
            error
          );
        }
      }

      console.log("\n📊 ===== MONTHLY RANK UPDATE JOB SUMMARY =====");
      console.log(`👥 Total customers processed: ${customers.length}`);
      console.log(`✅ Ranks updated: ${updatedCount}`);
      console.log(`⬆️  Upgraded: ${upgradedCount}`);
      console.log(`⬇️  Downgraded: ${downgradedCount}`);
      console.log(`➡️  Unchanged: ${unchangedCount}`);
      console.log(
        `🏁 Monthly Rank Update Job completed at ${new Date().toLocaleString(
          "vi-VN"
        )}\n`
      );
    } catch (error) {
      console.error("❌ Monthly Rank Update Job Error:", error);
    }
  });

  console.log(
    `💎 Monthly Rank Update Job scheduled: ${CRON_SCHEDULES.RANK_UPDATE} (11:55 PM daily)`
  );
};

/**
 * Chạy job ngay lập tức (cho testing hoặc manual trigger)
 */
export const runRankUpdateNow = async () => {
  console.log("\n💎 ===== MANUAL RANK UPDATE TRIGGERED =====");
  console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}`);

  try {
    const { month, year } = getCurrentPeriod();
    console.log(`📅 Period: ${month}/${year}`);

    const customers = await Customer.findAll();
    console.log(`👥 Found ${customers.length} customers`);

    const results = [];

    for (const customer of customers) {
      const totalSpent = await getCustomerTotalSpent(
        customer.customer_id,
        month,
        year
      );
      const newRank = determineRank(totalSpent);
      const oldRank = customer.segment_type;

      if (newRank !== oldRank) {
        await customer.update({ segment_type: newRank });

        await CustomerRankHistory.create({
          customer_id: customer.customer_id,
          old_rank: oldRank,
          new_rank: newRank,
          total_spent: totalSpent,
          changed_at: new Date(),
          period_month: month,
          period_year: year,
        });

        results.push({
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          old_rank: oldRank,
          new_rank: newRank,
          total_spent: totalSpent,
        });
      }
    }

    console.log(
      `✅ Rank update completed. ${results.length} customers updated.`
    );
    return results;
  } catch (error) {
    console.error("❌ Manual Rank Update Error:", error);
    throw error;
  }
};

/**
 * Preview xếp hạng mà không commit vào database
 */
export const previewRankUpdate = async () => {
  try {
    const { month, year } = getCurrentPeriod();
    const customers = await Customer.findAll();

    const preview = [];

    for (const customer of customers) {
      const totalSpent = await getCustomerTotalSpent(
        customer.customer_id,
        month,
        year
      );
      const newRank = determineRank(totalSpent);
      const oldRank = customer.segment_type;

      preview.push({
        customer_id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        current_rank: oldRank,
        new_rank: newRank,
        total_spent: totalSpent,
        will_change: newRank !== oldRank,
      });
    }

    return preview;
  } catch (error) {
    console.error("❌ Preview Rank Update Error:", error);
    throw error;
  }
};

export default monthlyRankUpdateJob;
