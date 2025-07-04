import { useDispatch, useSelector } from 'react-redux';

import { setAlertBox, closeAlertBox } from '../redux/slices/alertSlice';

export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
};

export const useReduxAlert = () => {
  const dispatch = useDispatch();
  const alertBox = useSelector((state) => state.alert.alertBox);

  const showSuccess = (message) => {
    dispatch(
      setAlertBox({
        open: true,
        error: false,
        type: ALERT_TYPES.SUCCESS,
        msg: message,
      })
    );
  };

  const showError = (message) => {
    dispatch(
      setAlertBox({
        open: true,
        error: true,
        type: ALERT_TYPES.ERROR,
        msg: message,
      })
    );
  };

  const closeAlert = () => {
    dispatch(closeAlertBox());
  };

  return {
    showSuccess,
    showError,
    closeAlert,
    alertBox,
    ALERT_TYPES,
  };
};
