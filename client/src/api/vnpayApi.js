import axios from 'axios';

const vnpayApi = {
  createPaymentUrl: async (orderId, amount) => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}`, { orderId, amount });
    return res.data;
  },
};

export default vnpayApi;
