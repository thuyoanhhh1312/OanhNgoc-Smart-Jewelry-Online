import axios from 'axios';

// Chấp nhận cả VITE_API_BASE_URL và VITE_API_URL (giữ backward compatibility)
const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

// Nếu BASE_URL đã kết thúc bằng /api thì chỉ thêm /chat, ngược lại thêm /api/chat
const CHAT_ENDPOINT = BASE_URL.endsWith('/api')
  ? `${BASE_URL}/chat`
  : `${BASE_URL}/api/chat`;

/**
 * Gửi tin nhắn chat tới backend (forward tới n8n).
 * Trả về dữ liệu phản hồi: { sessionId, reply, intent, orderStatus }
 * Ném lỗi nếu request thất bại.
 */
export async function sendChatMessage({ sessionId, userId = null, message }) {
  try {
    const { data } = await axios.post(CHAT_ENDPOINT, {
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
