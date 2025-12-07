import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../utils/errorCodes.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return next({
      statusCode: 401,
      code: ERROR_CODES.TOKEN_INVALID,
      message: "Token không hợp lệ hoặc thiếu.",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      return next({
        statusCode: 403,
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: "Token đã hết hạn hoặc không hợp lệ.",
      });
    }

    req.user = payload;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  const { user } = req;

  if (!user || user.role_id !== 1) {
    return next({
      statusCode: 403,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Bạn không có quyền truy cập (yêu cầu admin).",
    });
  }

  next();
};

export const isAdminOrStaff = (req, res, next) => {
  const { user } = req;
  if (!user || (user.role_id !== 1 && user.role_id !== 3)) {
    return next({
      statusCode: 403,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Bạn không có quyền truy cập (yêu cầu admin hoặc staff).",
    });
  }
  next();
};

// ✅ Staff Role (role_id = 3)
export const isStaff = (req, res, next) => {
  const { user } = req;
  if (!user || user.role_id !== 3) {
    return next({
      statusCode: 403,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Bạn không có quyền truy cập (yêu cầu staff).",
    });
  }
  next();
};
