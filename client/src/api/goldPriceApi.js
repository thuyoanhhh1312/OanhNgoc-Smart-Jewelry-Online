import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const goldPriceApi = {
  // Lấy giá vàng
  getGoldPrices: (location = 'TP.HCM') => axios.get(`${API_URL}/gold-prices?location=${location}`),

  // Admin: Cập nhật giá
  updateGoldPrice: (data) => axios.post(`${API_URL}/gold-prices`, data),

  // Admin: Kéo giá từ PNJ
  fetchGoldPrices: (location = 'TP.HCM') =>
    axios.post(`${API_URL}/gold-prices/fetch`, { location }),

  // Admin: Xóa giá
  deleteGoldPrice: (id) => axios.delete(`${API_URL}/gold-prices/${id}`),
};

export default goldPriceApi;
