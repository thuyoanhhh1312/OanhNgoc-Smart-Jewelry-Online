import axios from "axios";
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getBankAccounts = async (options = { all: false }) => {
    try {
        const params = options.all ? '?all=true' : '?enabled=true';
        const url = `${API_URL}/bank-accounts${params}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        throw error;
    }
};

// Tạo tài khoản ngân hàng mới
const createBankAccount = async (data, accessToken) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/bank-accounts`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating bank account:', error);
        throw error;
    }
};

// Lấy chi tiết tài khoản theo id
const getBankAccountById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/bank-accounts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching bank account by ID:', error);
        throw error;
    }
};

// Cập nhật tài khoản ngân hàng theo id
const updateBankAccount = async (id, data, accessToken) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/bank-accounts/${id}`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating bank account:', error);
        throw error;
    }
};

// Xóa tài khoản ngân hàng theo id
const deleteBankAccount = async (id, accessToken) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/bank-accounts/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting bank account:', error);
        throw error;
    }
};

// Bật/tắt trạng thái tài khoản (enable/disable)
const toggleBankAccountStatus = async (id, is_enabled, accessToken) => {
    try {
        const response = await axiosInstance.patch(
            `${API_URL}/bank-accounts/${id}/enable`,
            { is_enabled },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error toggling bank account status:', error);
        throw error;
    }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    getBankAccounts,
    createBankAccount,
    getBankAccountById,
    updateBankAccount,
    deleteBankAccount,
    toggleBankAccountStatus,
};