import { setAlertBox } from '../redux/slides/userSlide';
import { store } from '../redux/store';

// Alert type constants
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Global showAlert function that can be used anywhere
 * @param {string} message - The message to display
 * @param {boolean|string} typeOrIsError - Alert type or boolean for backward compatibility
 */
export const showAlert = (message, typeOrIsError = false) => {
  let alertType;

  // Handle backward compatibility with boolean isError parameter
  if (typeof typeOrIsError === 'boolean') {
    alertType = typeOrIsError ? 'error' : 'success';
  } else {
    alertType = typeOrIsError;
  }

  store.dispatch(
    setAlertBox({
      open: true,
      error: alertType === 'error', // Keep backward compatibility with error field
      type: alertType, // Add type field for future enhancements
      msg: message,
    })
  );
};

/**
 * Convenience functions for specific alert types
 */
export const showSuccess = (message) => showAlert(message, ALERT_TYPES.SUCCESS);
export const showError = (message) => showAlert(message, ALERT_TYPES.ERROR);
export const showWarning = (message) => showAlert(message, ALERT_TYPES.WARNING);
export const showInfo = (message) => showAlert(message, ALERT_TYPES.INFO);

/**
 * Hide the current alert
 */
export const hideAlert = () => {
  store.dispatch(
    setAlertBox({
      open: false,
      error: false,
      msg: '',
    })
  );
};

// Default export for convenience
export default showAlert;
