import React, { useState } from 'react';
import { FaPaperclip } from 'react-icons/fa';

import styles from './MessageInput.module.css';

const MessageInput = ({ onSend, isDisabled }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);

  const handleSend = () => {
    if (isDisabled) return; // Không cho gửi khi đang xử lý
    if (file) {
      onSend({ type: 'file', content: URL.createObjectURL(file) });
      setFile(null);
    } else if (input.trim()) {
      onSend({ type: 'text', content: input.trim() });
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        placeholder="Nhập tin nhắn..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
      />
      <div className={styles.fileInputWrapper} title="Đính kèm file">
        <FaPaperclip className={styles.fileIcon} />
        <input
          className={styles.attachFile}
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={isDisabled}
        />
      </div>
      <button className={styles.buttonSend} onClick={handleSend} disabled={isDisabled}>
        Gửi
      </button>
    </div>
  );
};

export default MessageInput;
