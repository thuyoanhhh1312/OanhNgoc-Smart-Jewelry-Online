import axiosInstance from "./axiosInstance";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getOrderStatus = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/order-status`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order status:", error);
    throw error;
  }
};

export default {
  getOrderStatus,
};
