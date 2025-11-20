// src/api/newsCategoryApi.js
import axios from 'axios';
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Lấy tất cả danh mục tin
const getNewsCategories = async () => {
  try {
    const res = await axios.get(`${API_URL}/news-categories`);
    return res.data;
  } catch (err) {
    console.error('Error fetching news categories:', err);
    throw err;
  }
};

// Lấy danh mục tin theo id (nếu cần)
const getNewsCategoryById = async (id, accessToken) => {
  try {
    const res = await axiosInstance.get(`${API_URL}/admin/news-categories/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching news category by id:', err);
    throw err;
  }
};

// Tạo danh mục tin (admin/staff)
const createNewsCategory = async (payload, accessToken) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/admin/news-categories`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error creating news category:', err);
    throw err;
  }
};

// Cập nhật danh mục tin
const updateNewsCategory = async (id, payload, accessToken) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/admin/news-categories/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error updating news category:', err);
    throw err;
  }
};

// Xóa danh mục tin
const deleteNewsCategory = async (id, accessToken) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/admin/news-categories/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error deleting news category:', err);
    throw err;
  }
};

export default {
  getNewsCategories,
  getNewsCategoryById,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
};
