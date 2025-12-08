import axios from 'axios';

// Lấy base url từ Vite env
const API_BASE = `${import.meta.env.VITE_API_URL}/payment`;

const vnpayApi = {
  createPaymentUrl: async (orderId, amount) => {
    const res = await axios.post(`${API_BASE}/create_payment_url`, {
      orderId,
      amount,
    });
    return res.data;
  },
};

export default vnpayApi;