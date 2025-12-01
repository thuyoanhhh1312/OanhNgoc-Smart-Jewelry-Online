import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const {
  MAIL_USER,
  MAIL_PASS,
  SENDGRID_API_KEY,
  SENDGRID_FROM,
} = process.env;

const hasGmailCredentials = MAIL_USER && MAIL_PASS;
const hasSendGridCredentials = SENDGRID_API_KEY && SENDGRID_FROM;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Cấu hình SMTP transporter (Gmail)
export const createMailTransporter = () => {
  if (!hasGmailCredentials) {
    throw new Error("MAIL_USER/MAIL_PASS are not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
};

/**
 * Gửi email (ưu tiên SendGrid nếu có cấu hình, fallback Gmail)
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} htmlContent - Nội dung HTML
 * @returns {Promise<boolean>} - true nếu gửi thành công
 */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    // SendGrid first (có sẵn API key trong .env)
    if (hasSendGridCredentials) {
      await sgMail.send({
        to,
        from: `OanhNgoc Jewelry <${SENDGRID_FROM}>`,
        subject,
        html: htmlContent,
      });
      console.log(`✅ Email sent via SendGrid to ${to}`);
      return true;
    }

    // Gmail fallback
    if (hasGmailCredentials) {
      const transporter = createMailTransporter();
      const mailOptions = {
        from: `"OanhNgoc Jewelry" <${MAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    }

    console.error(
      "❌ Failed to send email: No email credentials configured (SENDGRID_API_KEY/SENDGRID_FROM or MAIL_USER/MAIL_PASS)"
    );
    return false;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * Format số tiền VND
 * @param {number} amount - Số tiền
 * @returns {string} - Số tiền đã format
 */
export const formatVND = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format ngày theo định dạng vi-VN
 * @param {Date|string} date - Ngày cần format
 * @returns {string} - Ngày đã format
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format ngày giờ theo định dạng vi-VN
 * @param {Date|string} date - Ngày giờ cần format
 * @returns {string} - Ngày giờ đã format
 */
export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Lấy tháng và năm hiện tại
 * @returns {{month: number, year: number}}
 */
export const getCurrentPeriod = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  };
};

/**
 * Kiểm tra xem ngày có phải sinh nhật hôm nay không
 * @param {Date|string} birthday - Ngày sinh
 * @returns {boolean}
 */
export const isBirthdayToday = (birthday) => {
  if (!birthday) return false;

  const today = new Date();
  const birthDate = new Date(birthday);

  return (
    birthDate.getDate() === today.getDate() &&
    birthDate.getMonth() === today.getMonth()
  );
};
