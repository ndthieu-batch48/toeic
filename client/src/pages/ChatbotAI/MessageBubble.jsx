import React from 'react';
import ReactMarkdown from 'react-markdown';

import styles from './MessageBubble.module.css';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className={styles.markdownParagraph} {...props} />,
              ul: ({ node, ...props }) => <ul className={styles.markdownList} {...props} />,
              ol: ({ node, ...props }) => <ol className={styles.markdownList} {...props} />,
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code className={styles.inlineCode} {...props} />
                ) : (
                  <pre className={styles.codeBlock}>
                    <code {...props} />
                  </pre>
                ),
            }}>
            {message.content}
          </ReactMarkdown>
        );
      case 'image':
        return <img src={message.content} alt="sent" className={styles.image} />;
      case 'file':
        return (
          <a href={message.content} download className={styles.fileLink}>
            📄 Tải file
          </a>
        );
      case 'generating':
        return <p className={styles.generating}>{message.content}</p>;
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.bot}`}>{renderContent()}</div>
  );
};

export default MessageBubble;
