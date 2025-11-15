import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Preview xếp hạng (không commit vào database)
 * @param {string} accessToken - JWT token
 */
const previewRank = async (accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/rank/preview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error previewing rank:', error);
    throw error;
  }
};

/**
 * Chạy cập nhật rank ngay lập tức
 * @param {string} accessToken - JWT token
 */
const recalculateRank = async (accessToken) => {
  try {
    const response = await axiosInstance.post(
      `${API_URL}/rank/recalculate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error recalculating rank:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử thay đổi rank
 * @param {Object} params - Query parameters (customer_id, period_month, period_year)
 * @param {string} accessToken - JWT token
 */
const getRankHistory = async (params = {}, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/rank/history`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rank history:', error);
    throw error;
  }
};

/**
 * Lấy thống kê phân bố rank
 * @param {string} accessToken - JWT token
 */
const getRankDistribution = async (accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/rank/distribution`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rank distribution:', error);
    throw error;
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  previewRank,
  recalculateRank,
  getRankHistory,
  getRankDistribution,
};
