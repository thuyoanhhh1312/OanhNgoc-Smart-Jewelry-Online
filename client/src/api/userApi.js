import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Lấy danh sách user với hỗ trợ filter keyword và role_id
export const getUsers = async (keyword = "", roleId = "") => {
  try {
    // Xây dựng params query
    const params = {};
    if (keyword) params.keyword = keyword;
    if (roleId) params.role_id = roleId;

    const response = await axios.get(`${API_URL}/users`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Lấy danh sách role
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/role`);
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

// Xóa user (cần token auth)
export const deleteUser = async (id, accessToken) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Cập nhật user (cần token auth)
export const updateUser = async (id, name, email, role_id, accessToken) => {
  try {
    const response = await axiosInstance.put(
      `${API_URL}/users/${id}`,
      {
        name,
        email,
        role_id,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Lấy user theo id
export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

// Tạo user mới (cần token auth)
export const createUser = async (userData, accessToken) => {
  try {
    const response = await axiosInstance.post("/users", userData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
