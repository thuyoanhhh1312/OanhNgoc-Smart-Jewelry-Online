import axiosInstance from './axiosInstance';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Lấy tất cả promotion logs
 * @param {Object} params - Query parameters (campaign_id, promotion_id, customer_id, start_date, end_date, email_status)
 * @param {string} accessToken - JWT token
 */
const getAllPromotionLogs = async (params = {}, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/promotion-logs`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching promotion logs:', error);
    throw error;
  }
};

/**
 * Gửi promotion email thủ công
 * @param {Object} data - { campaign_id?, promotion_id?, customer_ids?, force_resend? }
 * @param {string} accessToken - JWT token
 */
const sendPromotionManually = async (data, accessToken) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/promotion-logs/send`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error sending promotion manually:', error);
    throw error;
  }
};

/**
 * Xóa promotion logs
 * @param {Array<number>} logIds - Array of log IDs to delete
 * @param {string} accessToken - JWT token
 */
const deletePromotionLogs = async (logIds, accessToken) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/promotion-logs`, {
      data: { log_ids: logIds },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting promotion logs:', error);
    throw error;
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getAllPromotionLogs,
  sendPromotionManually,
  deletePromotionLogs,
};
