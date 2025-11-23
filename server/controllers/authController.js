import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { sendPasswordResetOtpEmail } from '../services/emailService.js';
import {
  issuePasswordResetOtp,
  consumeOtpForEmail,
  createResetToken,
  consumeResetToken,
  OTP_CONSTANTS,
} from '../services/otpService.js';


const generateRandomPhone = () => {
  let phone = '0'; // Bắt đầu với số 0
  for (let i = 0; i < 9; i++) {
    phone += Math.floor(Math.random() * 10); // Tạo mỗi chữ số ngẫu nhiên từ 0 đến 9
  }
  return phone;
};

// Đăng ký người dùng (User + Customer)
export const registerUser = async (req, res, next) => {
  const { name, email, password, gender, birthday } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || !email || !password) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.'
    });
  }

  const t = await db.sequelize.transaction(); // Dùng transaction để đảm bảo toàn vẹn

  try {
    // Kiểm tra email đã tồn tại ở bảng User
    const existingUser = await db.User.findOne({ where: { email } });

    if (existingUser) {
      return next({
        statusCode: 409,
        code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'Email đã tồn tại.'
      });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(12);  // Sử dụng 12 vòng lặp thay vì 10
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user
    const newUser = await db.User.create(
      { name, email, password: hashedPassword, role_id: 2 }, // role_id=2 là customer
      { transaction: t }
    );

    // Tạo số điện thoại ngẫu nhiên
    const randomPhone = generateRandomPhone();

    // Tạo customer liên kết user_id
    const newCustomer = await db.Customer.create(
      {
        user_id: newUser.id,
        name,
        email,
        phone: randomPhone,  // Sử dụng số điện thoại ngẫu nhiên
        gender: gender || null,
        birthday: birthday || null,
        address: null
      },
      { transaction: t }
    );

    // Tạo token xác thực người dùng
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role_id: newUser.role_id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: '7d' }
    );

    newUser.refresh_token = refreshToken;
    await newUser.save({ transaction: t });

    // Commit transaction sau khi thành công
    await t.commit();

    return res.status(201).json({
      message: 'Đăng ký thành công',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id
      },
      customer: {
        customer_id: newCustomer.customer_id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        gender: newCustomer.gender,
        address: newCustomer.address
      }
    });
  } catch (err) {
    await t.rollback();
    return next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Lỗi server. Vui lòng thử lại sau.',
      error: err.message
    });
  }
};


// Đăng nhập người dùng
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Vui lòng nhập email và mật khẩu.'
    });
  }

  try {
    const user = await db.User.findOne({ where: { email } });
    const isValid = user && await bcrypt.compare(password, user.password);

    if (!isValid) {
      return next({
        statusCode: 401,
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Email hoặc mật khẩu không đúng.'
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: '7d' }
    );

    user.refresh_token = refreshToken;
    await user.save();

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      }
    });
  } catch (err) {
    return next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Lỗi server. Vui lòng thử lại sau.',
      error: err.message
    });
  }
};

export const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next({
      statusCode: 401,
      code: ERROR_CODES.TOKEN_INVALID,
      message: 'Thiếu refresh token.'
    });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    const user = await db.User.findOne({ where: { id: payload.userId } });

    if (!user || user.refresh_token !== refreshToken) {
      return next({
        statusCode: 403,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Refresh token không hợp lệ.'
      });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: '7d' }
    );

    user.refresh_token = newRefreshToken;
    await user.save();

    return res.status(200).json({
      message: 'Làm mới token thành công',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return next({
      statusCode: 403,
      code: ERROR_CODES.TOKEN_INVALID,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn.'
    });
  }
};

export const logoutUser = async (req, res, next) => {
  const { userId } = req.user;

  try {
    const user = await db.User.findByPk(userId);
    if (user) {
      user.refresh_token = null;
      await user.save();
    }

    return res.status(200).json({ message: 'Đăng xuất thành công.' });
  } catch (err) {
    return next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Lỗi khi đăng xuất.',
      error: err.message
    });
  }
};

export const currentUser = async (req, res, next) => {
  const { user } = req;

  try {
    if (!user) {
      return next({
        statusCode: 404,
        code: ERROR_CODES.USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.'
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    return next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Không thể lấy thông tin người dùng.',
      error: err.message
    });
  }
};

export const currentAdmin = async (req, res, next) => {
  try {
    const { user } = req;
    if (user.role_id !== 1) {
      return res.status(403).json({
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Bạn không có quyền truy cập (Admin only)",
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "Không xác định được quyền truy cập.",
    });
  }
};

export const currentStaffOrAdmin = async (req, res, next) => {
  try {
    const { user } = req;
    if (user.role_id !== 1 && user.role_id !== 3) {
      return res.status(403).json({
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Bạn không có quyền truy cập (Admin or Staff)",
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    next({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "Không xác định được quyền truy cập.",
    });
  }
};

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Vui lòng nhập email.'
    });
  }

  try {
    const customer = await db.Customer.findOne({ where: { email } });
    if (!customer) {
      return res.status(404).json({
        message: 'Email không tồn tại trong hệ thống.'
      });
    }

    const { otp, expiresAt } = await issuePasswordResetOtp(email);
    await sendPasswordResetOtpEmail({
      to: email,
      otp,
      expiresInMinutes: OTP_CONSTANTS.OTP_EXP_MINUTES,
    });

    return res.status(200).json({
      message: 'OTP sent',
      expired_at: expiresAt,
    });
  } catch (err) {
    return next({
      statusCode: err.statusCode || 500,
      code: err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: err.message || 'Không thể gửi OTP. Vui lòng thử lại.',
    });
  }
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Vui lòng nhập email và OTP.',
    });
  }

  try {
    const customer = await db.Customer.findOne({ where: { email } });
    if (!customer) {
      return res.status(404).json({
        message: 'Email không tồn tại trong hệ thống.',
      });
    }

    await consumeOtpForEmail(email, otp);
    const { token } = await createResetToken(email);

    return res.status(200).json({ reset_token: token });
  } catch (err) {
    return next({
      statusCode: err.statusCode || 500,
      code: err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: err.message || 'OTP không hợp lệ.',
    });
  }
};

export const resetPassword = async (req, res, next) => {
  const { reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Thiếu reset token hoặc mật khẩu mới.',
    });
  }

  if (new_password.length < 6) {
    return next({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Mật khẩu mới phải tối thiểu 6 ký tự.',
    });
  }

  try {
    const tokenRecord = await consumeResetToken(reset_token);
    const user = await db.User.findOne({ where: { email: tokenRecord.email } });

    if (!user) {
      return next({
        statusCode: 404,
        code: ERROR_CODES.USER_NOT_FOUND,
        message: 'Người dùng không tồn tại.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    return res.status(200).json({
      message: 'Password updated',
    });
  } catch (err) {
    return next({
      statusCode: err.statusCode || 500,
      code: err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: err.message || 'Không thể cập nhật mật khẩu.',
    });
  }
};
