import axios from "axios";
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

const createCategory = async (categoryName, description, accessToken) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/categories`, {
      category_name: categoryName,
      description: description,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    throw error;
  }
}

const updateCategory = async (id, categoryName, description, accessToken) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/categories/${id}`, {
      category_name: categoryName,
      description: description,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

// Xóa sản phẩm
const deleteCategory = async (id, accessToken) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

export default {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory
};