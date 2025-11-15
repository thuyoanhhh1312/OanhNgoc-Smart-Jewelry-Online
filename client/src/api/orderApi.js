import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Lấy tất cả đơn hàng
const getAllOrders = async (accessToken) => {
  // accessToken: là token xác thực người dùng, để đảm bảo chỉ người dùng đã đăng nhập mới có thể truy cập dữ liệu
  try {
    //Cấu trúc câu lệnh gọi API: const response = await axiosInstance.get(url, config);
    //Trong đó:url: địa chỉ endpoint API bạn muốn gọi (ví dụ: ${API_URL}/orders).
    // config: một object chứa các cấu hình bổ sung cho request, như: headers: gửi thêm các header HTTP, ví dụ token xác thực.params: tham số truy vấ
    //axiosInstance: là một instance của axios đã được cấu hình sẵn (ví dụ: baseURL, headers, timeout, v.v.)
    const response = await axiosInstance.get(`${API_URL}/orders`, {
      //dùng Get để lấy data từ server (xem thông tin, không thay đổi gì trên server)
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data; //response.data: chứa dữ liệu trả về từ server, thường là một mảng các đơn hàng
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

const getOrderById = async (id, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
};

const updateOrder = async (id, status, accessToken) => {
  try {
    const response = await axiosInstance.put(
      //dùng Put: Cập nhật toàn bộ tài nguyên (thay thế) ( để cập nhật thông tin của đơn hàng)
      `${API_URL}/orders/${id}`,
      {
        status_id: status,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

const updateStaff = async (id, staff_id, accessToken) => {
  try {
    const response = await axiosInstance.put(
      `${API_URL}/update-staff/${id}`,
      {
        user_id: staff_id,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

const getOrderByCustomer = async (userId, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/orders/by-customer/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders by user ID:', error);
    throw error;
  }
};

const getOrderByUserId = async (userId, accessToken) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/orders/by-user/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders by user ID:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/orders`, orderData); //post tạo mới tài nguyên trên server (Khi muốn tạo mới một đơn hàng, hay yêu cầu server thực hiện một hành động như tính giá, đặt hàng.)
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

const updateIsDeposit = async (id, isDeposit, accessToken) => {
  try {
    const response = await axiosInstance.patch(
      //Patch: Cập nhật một phần tài nguyên (để cập nhật trạng thái đặt cọc của đơn hàng)
      `${API_URL}/orders/${id}/deposit`,
      { is_deposit: isDeposit },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error updating is_deposit:', error);
    throw error;
  }
};

// Tạo đơn hàng (checkout)
const checkout = async (orderData, accessToken) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/checkout`, orderData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during checkout:', error);
    throw error;
  }
};

// Tính toán giá với mã khuyến mãi
const calculatePrice = async (priceData, accessToken) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/calculate-price`, {
      items: priceData?.items,
      promotion_code: priceData?.promotion_code,
      user_id: priceData?.user_id,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating price:', error);
    throw error;
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getAllOrders,
  getOrderById,
  updateOrder,
  updateStaff,
  getOrderByCustomer,
  createOrder,
  updateIsDeposit,
  checkout,
  calculatePrice,
  getOrderByUserId
};
