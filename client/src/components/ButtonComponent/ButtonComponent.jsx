import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './ButtonComponent.module.css';

const ButtonComponent = ({
  type = 'button',
  onClick,
  children,
  isLoading = false,
  disabled = false,
  isActive = false,
  isAnswered = false,
  toggleState = false,
  showIcon = false,
  className = '',
  variant = 'default',
}) => {
  const getButtonClass = () => {
    let baseClass = `${styles.button} ${styles[variant]}`;
    if (isActive) baseClass += ` ${styles.active}`;
    if (isAnswered) baseClass += ` ${styles.answered}`;
    if (disabled || isLoading) baseClass += ` ${styles.disabled}`;
    return `${baseClass} ${className}`.trim();
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={getButtonClass()}>
      {isLoading ? (
        <CircularProgress size={24} className={styles.progress} />
      ) : (
        <>
          {children}
          {showIcon && variant === 'toggle' && (
            <FontAwesomeIcon
              icon={faCaretDown}
              className={`${styles.icon} ${toggleState ? styles.rotateUp : ''}`}
            />
          )}
        </>
      )}
    </button>
  );
};

ButtonComponent.propTypes = {
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  isActive: PropTypes.bool,
  isAnswered: PropTypes.bool,
  toggleState: PropTypes.bool,
  showIcon: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'submit', 'toggle', 'question']),
};

export default ButtonComponent;
