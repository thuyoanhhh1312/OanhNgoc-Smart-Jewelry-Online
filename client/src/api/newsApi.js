// src/api/newsApi.js
import axios from 'axios';
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL;

// Hàm build FormData dùng chung cho create + update
const buildNewsFormData = (newsData, imageFile) => {
  const formData = new FormData();

  // Các field cơ bản
  if (newsData.title) formData.append('title', newsData.title);
  if (newsData.slug) formData.append('slug', newsData.slug);
  if (newsData.excerpt !== undefined) formData.append('excerpt', newsData.excerpt || '');
  if (newsData.content) formData.append('content', newsData.content);
  if (newsData.article_category_id)
    formData.append('article_category_id', newsData.article_category_id);
  if (newsData.status) formData.append('status', newsData.status);

  if (newsData.published_at) {
    formData.append('published_at', newsData.published_at);
  }

  // Tags: gửi dạng tags[]
  if (Array.isArray(newsData.tags)) {
    newsData.tags.forEach((tagId) => {
      formData.append('tags[]', tagId);
    });
  }

  // Ảnh đại diện: file
  if (imageFile) {
    // field name 'image' hoặc 'thumbnail' tùy backend bạn định nghĩa
    formData.append('thumbnail', imageFile);
  }

  return formData;
};
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

const createNews = async (newsData, imageFile, accessToken) => {
  try {
    const formData = buildNewsFormData(newsData, imageFile);

    const response = await axiosInstance.post(`${API_URL}/admin/news`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Không set Content-Type, để axios tự set multipart/form-data
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
};
const updateNews = async (id, newsData, imageFile, accessToken) => {
  try {
    const formData = buildNewsFormData(newsData, imageFile);

    const response = await axiosInstance.put(`${API_URL}/admin/news/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // KHÔNG set Content-Type thủ công
      },
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
