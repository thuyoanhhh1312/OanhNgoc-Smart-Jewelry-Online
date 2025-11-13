import axiosInstance from './axiosInstance';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Lấy tất cả campaigns
 * @param {Object} params - Query parameters (is_active, search)
 * @param {string} accessToken - JWT token
 */
const getAllCampaigns = async (params = {}, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/campaigns`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

/**
 * Lấy campaign theo ID
 * @param {number} id - Campaign ID
 * @param {string} accessToken - JWT token
 */
const getCampaignById = async (id, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/campaigns/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    throw error;
  }
};

/**
 * Tạo campaign mới
 * @param {Object} data - Campaign data
 * @param {string} accessToken - JWT token
 */
const createCampaign = async (data, accessToken) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/campaigns`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

/**
 * Cập nhật campaign
 * @param {number} id - Campaign ID
 * @param {Object} data - Updated campaign data
 * @param {string} accessToken - JWT token
 */
const updateCampaign = async (id, data, accessToken) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/campaigns/${id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

/**
 * Xóa campaign
 * @param {number} id - Campaign ID
 * @param {string} accessToken - JWT token
 */
const deleteCampaign = async (id, accessToken) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/campaigns/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
