import axios from 'axios';
const API_BASE = 'http://localhost:3001/api/payment';

const vnpayApi = {
  createPaymentUrl: async (orderId, amount) => {
    const res = await axios.post(`${API_BASE}/create_payment_url`, { orderId, amount });
    return res.data;
  },
};

export default vnpayApi;
