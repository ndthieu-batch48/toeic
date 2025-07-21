import { configureStore } from '@reduxjs/toolkit';

import alertReducer from './slices/alertSlice';
import otpReducer from './slices/otpSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    alert: alertReducer,
    otp: otpReducer,
  },
});
