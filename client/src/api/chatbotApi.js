import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Gửi tin nhắn chat tới backend (forward tới n8n).
 * Trả về dữ liệu phản hồi: { sessionId, reply, intent, orderStatus }
 * Ném lỗi nếu request thất bại.
 */
export async function sendChatMessage({ sessionId, userId = null, message }) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/chat`, {
      sessionId,
      userId: userId ?? null,
      message,
    });
    return data;
  } catch (error) {
    console.error('sendChatMessage error:', error);
    throw error;
  }
}
