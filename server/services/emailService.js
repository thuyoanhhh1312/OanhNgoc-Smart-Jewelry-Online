import sgMail from "@sendgrid/mail";

const sendGridKey = process.env.SENDGRID_API_KEY;
const sendGridFrom = process.env.SENDGRID_FROM;

if (sendGridKey) {
  sgMail.setApiKey(sendGridKey);
}

export const sendPasswordResetOtpEmail = async ({
  to,
  otp,
  expiresInMinutes = 5,
}) => {
  if (!sendGridKey || !sendGridFrom) {
    const error = new Error("SendGrid credentials are missing");
    error.statusCode = 500;
    throw error;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color: #d4af37; text-align: center;">Mã OTP đặt lại mật khẩu</h2>
      <p>Xin chào,</p>
      <p>Bạn hoặc ai đó vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>OanhNgoc Smart Jewelry</strong>.</p>
      <p style="font-size: 16px;">Mã OTP của bạn là:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; text-align: center;">${otp}</p>
      <p>Mã OTP này sẽ hết hạn sau <strong>${expiresInMinutes} phút</strong>. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>
      <p>Trân trọng,<br/>OanhNgoc Smart Jewelry</p>
    </div>
  `;

  await sgMail.send({
    to,
    from: sendGridFrom,
    subject: "Mã OTP đặt lại mật khẩu",
    html,
  });
};
