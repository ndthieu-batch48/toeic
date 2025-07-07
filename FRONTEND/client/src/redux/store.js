import { configureStore } from '@reduxjs/toolkit';

import alertReducer from './slices/alertSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    alert: alertReducer,
  },
});
