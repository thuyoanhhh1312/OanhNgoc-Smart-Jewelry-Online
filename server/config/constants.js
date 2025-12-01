// Ngưỡng xếp hạng khách hàng (VND)
export const RANK_THRESHOLDS = {
  BRONZE: 0, // <= 2,000,000
  SILVER: 2000000, // > 2,000,000 and <= 5,000,000
  GOLD: 5000000, // > 5,000,000 and <= 10,000,000
  VIP: 10000000, // > 10,000,000
};

// Trạng thái đơn hàng được tính vào doanh thu
export const ORDER_STATUS_COMPLETED = "completed";

// Segment targets cho promotion
export const SEGMENT_TARGETS = {
  BIRTHDAY: "birthday",
  VIP: "vip",
  GOLD: "gold",
  SILVER: "silver",
  BRONZE: "bronze",
  ALL: null,
};

// Cấu hình email templates
export const EMAIL_TEMPLATES = {
  BIRTHDAY: {
    subject: "🎉 Chúc mừng sinh nhật từ OanhNgoc Jewelry!",
    getBody: (customerName, promotionCode, discount, endDate) => {
      const endDateLine = endDate
        ? `<p style="color: #666;">⏰ Ưu đãi có hiệu lực đến: <strong>${endDate}</strong></p>`
        : "";

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d4af37; text-align: center;">🎂 Chúc mừng sinh nhật!</h2>
          <p>Kính gửi <strong>${customerName}</strong>,</p>
          <p>Nhân dịp sinh nhật của bạn, <strong>OanhNgoc Smart Jewelry</strong> xin gửi tới bạn những lời chúc tốt đẹp nhất!</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">🎁 <strong>Mã khuyến mãi đặc biệt:</strong></p>
            <p style="margin: 10px 0; font-size: 24px; color: #d4af37; font-weight: bold; text-align: center;">${promotionCode}</p>
            <p style="margin: 0;">Giảm ngay <strong style="color: #ff6b6b;">${discount}%</strong> cho đơn hàng của bạn!</p>
          </div>
          ${endDateLine}
          <p style="margin-top: 30px;">Trân trọng,<br/><strong>OanhNgoc Jewelry Team</strong></p>
        </div>
      `;
    },
  },
  SEGMENT_CAMPAIGN: {
    subject: (promotionName) =>
      `✨ Ưu đãi đặc biệt dành cho bạn - ${promotionName}`,
    getBody: (
      customerName,
      promotionName,
      promotionCode,
      discount,
      endDate,
      segment
    ) => {
      const endDateLine = endDate
        ? `<p style="color: #666;">⏰ Ưu đãi có hiệu lực đến: <strong>${endDate}</strong></p>`
        : "";

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d4af37; text-align: center;">✨ ${promotionName}</h2>
          <p>Kính gửi <strong>${customerName}</strong>,</p>
          <p>Với tư cách là khách hàng <strong style="color: #d4af37; text-transform: uppercase;">${segment}</strong> của chúng tôi, bạn nhận được ưu đãi đặc biệt:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">🎁 <strong>Mã khuyến mãi:</strong></p>
            <p style="margin: 10px 0; font-size: 24px; color: #d4af37; font-weight: bold; text-align: center;">${promotionCode}</p>
            <p style="margin: 0;">Giảm ngay <strong style="color: #ff6b6b;">${discount}%</strong> cho đơn hàng của bạn!</p>
          </div>
          ${endDateLine}
          <p style="margin-top: 30px;">Trân trọng,<br/><strong>OanhNgoc Jewelry Team</strong></p>
        </div>
      `;
    },
  },
  RANK_UPGRADE: {
    subject: (newRank) =>
      `🎊 Chúc mừng bạn đã thăng hạng lên ${newRank.toUpperCase()}!`,
    getBody: (customerName, oldRank, newRank, totalSpent) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #d4af37; text-align: center;">🎊 Chúc mừng thăng hạng!</h2>
        <p>Kính gửi <strong>${customerName}</strong>,</p>
        <p>Chúc mừng bạn đã thăng hạng từ <strong style="text-transform: uppercase;">${
          oldRank || "BRONZE"
        }</strong> lên <strong style="color: #d4af37; text-transform: uppercase;">${newRank}</strong>!</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">💎 Tổng chi tiêu: <strong style="color: #d4af37;">${totalSpent}</strong></p>
          <p style="margin: 10px 0 0 0;">Hạng mới của bạn sẽ mở ra nhiều ưu đãi đặc quyền hơn!</p>
        </div>
        <p>Cảm ơn bạn đã tin tưởng và đồng hành cùng <strong>OanhNgoc Smart Jewelry</strong>!</p>
        <p style="margin-top: 30px;">Trân trọng,<br/><strong>OanhNgoc Jewelry Team</strong></p>
      </div>
    `,
  },
};

// Lịch chạy cron jobs
export const CRON_SCHEDULES = {
  BIRTHDAY_EMAIL: "0 9 * * *", // 9:00 AM hàng ngày
  CAMPAIGN_EMAIL: "30 9 * * *", // 9:30 AM hàng ngày
  RANK_UPDATE: "55 23 * * *", // 11:55 PM hàng ngày
};
