import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function getProvinces() {
    try {
        const response = await axios.get(`${API_URL}/locations/provinces`);
        return response.data;
    } catch (error) {
        console.error('Lấy tỉnh/thành thất bại:', error);
        throw error;
    }
}

export async function getDistricts(provinceCode) {
    if (!provinceCode) throw new Error('provinceCode là bắt buộc');
    try {
        const response = await axios.get(`${API_URL}/locations/districts/${provinceCode}`);
        return response.data;
    } catch (error) {
        console.error('Lấy quận/huyện thất bại:', error);
        throw error;
    }
}

export async function getWards(districtCode) {
    if (!districtCode) throw new Error('districtCode là bắt buộc');
    try {
        const response = await axios.get(`${API_URL}/locations/wards/${districtCode}`);
        return response.data;
    } catch (error) {
        console.error('Lấy phường/xã thất bại:', error);
        throw error;
    }
}