import React, { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../api/chatbotApi';

const initialGreeting =
  'Xin chào 👋 Em là trợ lý của OanhNgoc Jewelry. Em có thể giúp gì cho anh/chị ạ?';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('chatbot_session_id');
    if (stored) {
      setSessionId(stored);
    } else {
      const generated =
        (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
        `session-${Date.now()}`;
      localStorage.setItem('chatbot_session_id', generated);
      setSessionId(generated);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'greeting',
          sender: 'bot',
          text: initialGreeting,
        },
      ]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage({
        sessionId,
        userId: null,
        message: trimmed,
      });

      if (!sessionId && data?.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('chatbot_session_id', data.sessionId);
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data?.reply || 'Em chưa nhận được phản hồi, anh/chị thử lại giúp em nhé.',
        intent: data?.intent,
        orderStatus: data?.orderStatus,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          sender: 'bot',
          text: 'Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const styles = {
    floatingButton: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#0d6efd',
      color: '#fff',
      border: 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      cursor: 'pointer',
      fontSize: '20px',
      zIndex: 2000,
    },
    panel: {
      position: 'fixed',
      bottom: '84px',
      right: '20px',
      width: '320px',
      maxWidth: '90vw',
      height: '420px',
      maxHeight: '70vh',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 2000,
    },
    header: {
      background: '#111827',
      color: '#fff',
      padding: '12px 16px',
      fontWeight: 600,
      fontSize: '14px',
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      background: '#f9fafb',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '13px',
    },
    messageRow: (sender) => ({
      display: 'flex',
      justifyContent: sender === 'user' ? 'flex-end' : 'flex-start',
    }),
    bubble: (sender) => ({
      background: sender === 'user' ? '#0d6efd' : '#e5e7eb',
      color: sender === 'user' ? '#fff' : '#111827',
      padding: '10px 12px',
      borderRadius: '12px',
      maxWidth: '80%',
      whiteSpace: 'pre-wrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontSize: '13px',
      lineHeight: 1.4,
    }),
    inputArea: {
      borderTop: '1px solid #e5e7eb',
      padding: '10px',
      background: '#fff',
      display: 'flex',
      gap: '8px',
    },
    input: {
      flex: 1,
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      padding: '8px 10px',
      fontSize: '13px',
      outline: 'none',
    },
    sendButton: {
      background: '#0d6efd',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    typing: {
      fontSize: '12px',
      color: '#6b7280',
      padding: '4px 8px',
    },
  };

  return (
    <>
      <button type="button" style={styles.floatingButton} onClick={toggleOpen}>
        💬
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>Trợ lý mua sắm ✨</div>
          <div style={styles.messages}>
            {messages.map((msg) => (
              <div key={msg.id} style={styles.messageRow(msg.sender)}>
                <div style={styles.bubble(msg.sender)}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div style={styles.messageRow('bot')}>
                <div style={styles.bubble('bot')}>Đang nhập...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={styles.inputArea}>
            <textarea
              rows={1}
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" style={styles.sendButton} onClick={handleSend}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
