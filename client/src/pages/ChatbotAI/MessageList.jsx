import React, { useEffect, useRef } from 'react';

import MessageBubble from './MessageBubble';
import styles from './MessageList.module.css';

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.messageList}>
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
