// src/api/tagApi.js
import axios from 'axios';
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Lấy tất cả tags
const getTags = async () => {
  try {
    const res = await axios.get(`${API_URL}/tags`);
    return res.data;
  } catch (err) {
    console.error('Error fetching tags:', err);
    throw err;
  }
};

// Lấy tag theo id (nếu cần)
const getTagById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/tags/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching tag by id:', err);
    throw err;
  }
};

// Tạo tag (admin/staff)
const createTag = async (payload, accessToken) => {
  try {
    const res = await axiosInstance.post(`${API_URL}/admin/tags`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error creating tag:', err);
    throw err;
  }
};

// Cập nhật tag
const updateTag = async (id, payload, accessToken) => {
  try {
    const res = await axiosInstance.put(`${API_URL}/admin/tags/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error updating tag:', err);
    throw err;
  }
};

// Xóa tag
const deleteTag = async (id, accessToken) => {
  try {
    const res = await axiosInstance.delete(`${API_URL}/admin/tags/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error('Error deleting tag:', err);
    throw err;
  }
};

export default {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};
