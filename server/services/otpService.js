import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../models/index.js";

const OTP_LENGTH = 6;
const OTP_EXP_MINUTES = 5;
const RESET_TOKEN_EXP_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

const padOtp = (otpNumber) => otpNumber.toString().padStart(OTP_LENGTH, "0");

const generateNumericOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  const otpNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return padOtp(otpNumber);
};

export const issuePasswordResetOtp = async (email) => {
  await enforceOtpRateLimit(email);

  const otp = generateNumericOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

  await db.PasswordResetOtp.destroy({ where: { email } });

  await db.PasswordResetOtp.create({
    email,
    otp: hashedOtp,
    expired_at: expiresAt,
    created_at: new Date(),
  });

  return { otp, expiresAt };
};

export const consumeOtpForEmail = async (email, otp) => {
  const otpRecord = await db.PasswordResetOtp.findOne({ where: { email } });

  if (!otpRecord) {
    const error = new Error("OTP không tồn tại hoặc đã được sử dụng.");
    error.statusCode = 400;
    error.code = "OTP_NOT_FOUND";
    throw error;
  }

  if (otpRecord.expired_at < new Date()) {
    await db.PasswordResetOtp.destroy({ where: { email } });
    const error = new Error("OTP đã hết hạn.");
    error.statusCode = 400;
    error.code = "OTP_EXPIRED";
    throw error;
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otp);
  if (!isValid) {
    const error = new Error("OTP không chính xác.");
    error.statusCode = 400;
    error.code = "OTP_INVALID";
    throw error;
  }

  await db.PasswordResetOtp.destroy({ where: { email } });
};

export const createResetToken = async (email) => {
  const token = uuidv4();
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXP_MINUTES * 60 * 1000
  );

  await db.PasswordResetToken.update(
    { used_at: new Date() },
    { where: { email, used_at: null } }
  );

  await db.PasswordResetToken.create({
    email,
    token,
    expired_at: expiresAt,
    created_at: new Date(),
  });

  return { token, expiresAt };
};

export const consumeResetToken = async (token) => {
  const tokenRecord = await db.PasswordResetToken.findOne({ where: { token } });

  if (!tokenRecord) {
    const error = new Error("Reset token không hợp lệ.");
    error.statusCode = 400;
    error.code = "RESET_TOKEN_INVALID";
    throw error;
  }

  if (tokenRecord.used_at) {
    const error = new Error("Reset token đã được sử dụng.");
    error.statusCode = 400;
    error.code = "RESET_TOKEN_USED";
    throw error;
  }

  if (tokenRecord.expired_at < new Date()) {
    const error = new Error("Reset token đã hết hạn.");
    error.statusCode = 400;
    error.code = "RESET_TOKEN_EXPIRED";
    throw error;
  }

  tokenRecord.used_at = new Date();
  await tokenRecord.save();

  return tokenRecord;
};

const enforceOtpRateLimit = async (email) => {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const rateRecord = await db.PasswordResetRateLimit.findOne({
    where: { email },
  });

  if (!rateRecord) {
    await db.PasswordResetRateLimit.create({
      email,
      request_count: 1,
      window_start: now,
      updated_at: now,
    });
    return;
  }

  if (rateRecord.window_start < windowStart) {
    rateRecord.window_start = now;
    rateRecord.request_count = 1;
    rateRecord.updated_at = now;
    await rateRecord.save();
    return;
  }

  if (rateRecord.request_count >= RATE_LIMIT_MAX_REQUESTS) {
    const error = new Error(
      "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau."
    );
    error.statusCode = 429;
    error.code = "OTP_RATE_LIMIT";
    throw error;
  }

  rateRecord.request_count += 1;
  rateRecord.updated_at = now;
  await rateRecord.save();
};

export const OTP_CONSTANTS = {
  OTP_EXP_MINUTES,
};
