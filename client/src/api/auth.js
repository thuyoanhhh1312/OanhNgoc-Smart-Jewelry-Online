import axios from "axios";
import axiosInstance from './axiosInstance';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Đăng ký tài khoản
export const register = async (data) => {
    return await API.post("/auth/register", data);
};

// Đăng nhập
export const login = async (data) => {
    return await API.post("/auth/login", data);
};

// Làm mới access token
export const refreshToken = async (refreshToken) => {
    return await API.post("/auth/refresh-token", { refreshToken });
};

// Đăng xuất
export const logout = async (accessToken) => {
    return await axiosInstance.post(
        "/auth/logout",
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
};

// Lấy user hiện tại
export const currentUser = async (accessToken) => {
    return await axiosInstance.get("/auth/current-user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

export const currentAdmin = async (accessToken) => {
    return await axiosInstance.get("/auth/current-admin", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

export const currentAdminOrStaff = async (accessToken) => {
    return await axiosInstance.get("/auth/current-admin-or-staff", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

// Gửi email để lấy resetToken (forgot password)
export const forgotPassword = async (email) => {
    return await API.post("/auth/forgot-password", { email });
};

// Đổi mật khẩu với password, confirm_password, resetToken
export const resetPassword = async ({ password, confirm_password, resetToken }) => {
    return await API.post("/auth/reset-password", {
        password,
        confirm_password,
        resetToken,
    });
};
