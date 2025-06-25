import { useDispatch } from 'react-redux';

import { setAlertBox, closeAlertBox } from '../redux/slides/userSlide';

export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const useReduxAlert = () => {
  const dispatch = useDispatch();

  /**
   * Show alert with specified type and message
   * @param {string} message - The message to display
   * @param {string} type - Alert type (success, error, warning, info)
   */
  const showAlert = (message, type = ALERT_TYPES.INFO) => {
    const alertType = Object.values(ALERT_TYPES).includes(type) ? type : ALERT_TYPES.INFO; // Validate alert type

    dispatch(
      setAlertBox({
        open: true,
        error: alertType === ALERT_TYPES.ERROR, // backward compatibility
        type: alertType,
        msg: message,
      })
    );
  };

  const showSuccess = (message) => showAlert(message, ALERT_TYPES.SUCCESS);
  const showError = (message) => showAlert(message, ALERT_TYPES.ERROR);
  const showWarning = (message) => showAlert(message, ALERT_TYPES.WARNING);
  const showInfo = (message) => showAlert(message, ALERT_TYPES.INFO);

  const closeAlert = () => {
    dispatch(closeAlertBox());
  };

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
    ALERT_TYPES,
  };
};
