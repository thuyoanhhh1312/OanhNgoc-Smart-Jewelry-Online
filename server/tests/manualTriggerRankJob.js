import { runRankUpdateNow } from "../jobs/monthlyRankUpdateJob.js";
import { formatVND } from "../utils/emailHelper.js";

/**
 * Manual trigger for Monthly Rank Update Job
 * Run: node tests/manualTriggerRankJob.js
 */

console.log("\n💎 ===== MANUAL RANK UPDATE JOB TRIGGER =====");
console.log(`⏰ Time: ${new Date().toLocaleString("vi-VN")}\n`);

async function runRankUpdate() {
  try {
    const results = await runRankUpdateNow();

    console.log("\n📊 ===== RANK UPDATE RESULTS =====");
    console.log(`✅ Total updated: ${results.length}\n`);

    if (results.length > 0) {
      console.log("Changes:");
      results.forEach((result) => {
        console.log(`\n👤 ${result.name} (${result.email})`);
        console.log(
          `   ${result.old_rank.toUpperCase()} → ${result.new_rank.toUpperCase()}`
        );
        console.log(`   Total Spent: ${formatVND(result.total_spent)}`);
      });
    } else {
      console.log("No rank changes this month.");
    }

    console.log(
      `\n🏁 Job completed at ${new Date().toLocaleString("vi-VN")}\n`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Rank Update Job Error:", error);
    process.exit(1);
  }
}

runRankUpdate();
