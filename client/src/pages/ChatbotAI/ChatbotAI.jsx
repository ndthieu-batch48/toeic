import React, { useState } from 'react';

import styles from './ChatbotAI.module.css';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { sendPromptToBackend } from '../../service/ChatbotAI';

const ChatbotAI = () => {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = async (message) => {
    // Thêm tin nhắn của người dùng
    const newMessages = [...messages, { ...message, sender: 'user' }];
    setMessages(newMessages);
    setIsGenerating(true);

    // Thêm tin nhắn "Generating..." tạm thời
    setMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        type: 'generating',
        content: 'Generating...',
      },
    ]);

    try {
      const aiReply = await sendPromptToBackend(message.content);
      // Xóa tin nhắn "Generating..." và thêm phản hồi AI
      setMessages((prev) =>
        prev
          .filter((msg) => msg.type !== 'generating')
          .concat({
            sender: 'bot',
            type: 'text',
            content: aiReply,
          })
      );
    } catch (error) {
      console.error('Lỗi gọi Gemini:', error);
      // Xóa tin nhắn "Generating..." và thêm thông báo lỗi
      setMessages((prev) =>
        prev
          .filter((msg) => msg.type !== 'generating')
          .concat({
            sender: 'bot',
            type: 'text',
            content: '⚠️Không thể kết nối với AI. Vui lòng thử lại!',
          })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} isDisabled={isGenerating} />
    </div>
  );
};

export default ChatbotAI;
