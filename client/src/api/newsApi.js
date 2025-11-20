// src/api/newsApi.js
import axios from 'axios';
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Lấy danh sách bài viết (có hỗ trợ query: page, limit, q, category_id, status)
const getNews = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/news`, { params });
    return response.data; // { data, meta }
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

// Lấy danh sách bài viết cho admin (tất cả status, không filter)
const getAdminNews = async (params = {}, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/admin/news`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data; // { data, meta }
  } catch (error) {
    console.error('Error fetching admin news:', error);
    throw error;
  }
};

// Lấy chi tiết bài viết theo ID (admin)
const getNewsAdminById = async (id, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/admin/news/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    throw error;
  }
};

// Lấy chi tiết bài viết theo slug
const getNewsBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/news/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching news by slug:', error);
    throw error;
  }
};

// Tạo bài viết mới (admin/staff)
const createNews = async (newsData, accessToken) => {
  try {
    // Nếu có file thumbnail => FormData
    let body = newsData;
    let headers = { Authorization: `Bearer ${accessToken}` };

    if (newsData.thumbnail instanceof File) {
      const formData = new FormData();
      Object.entries(newsData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (k === 'tags' && Array.isArray(v)) {
            formData.append('tags', JSON.stringify(v));
          } else {
            formData.append(k, v);
          }
        }
      });
      body = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await axiosInstance.post(`${API_URL}/admin/news`, body, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
};

// Cập nhật bài viết
const updateNews = async (id, newsData, accessToken) => {
  try {
    let body = newsData;
    let headers = { Authorization: `Bearer ${accessToken}` };

    if (newsData.thumbnail instanceof File) {
      const formData = new FormData();
      Object.entries(newsData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (k === 'tags' && Array.isArray(v)) {
            formData.append('tags', JSON.stringify(v));
          } else {
            formData.append(k, v);
          }
        }
      });
      body = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await axiosInstance.put(`${API_URL}/admin/news/${id}`, body, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
};

// Xóa bài viết
const deleteNews = async (id, accessToken) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/admin/news/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};

export default {
  getNews,
  getAdminNews,
  getNewsAdminById,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
};
