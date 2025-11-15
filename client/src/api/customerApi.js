import axios from "axios";
import axiosInstance from "./axiosInstance";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw error;
  }
};

export const deleteCustomer = async (id, accessToken) => {
  try {
    const response = await axios.delete(`${API_URL}/customers/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer with id=${id}:`, error);
    throw error;
  }
};

export const getCustomers = async (keyword = "") => {
  try {
    const response = await axios.get(`${API_URL}/customers`, {
      params: { keyword }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

export const updateCustomerProfile = async (data, accessToken) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/customers/profile`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating customer profile:", error);
    throw error;
  }
};

export const getCustomerByUserId = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/customers/by-user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer by userId=${userId}:`, error);
    throw error;
  }
};

