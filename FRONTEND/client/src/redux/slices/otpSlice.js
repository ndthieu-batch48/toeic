import { createSlice } from '@reduxjs/toolkit';

const otpSlice = createSlice({
  name: 'otp',
  initialState: {
    email: '',
  },
  reducers: {
    setOtpEmail: (state, action) => {
      state.email = action.payload;
    },
    clearOtpEmail: (state) => {
      state.email = '';
    },
  },
});

export const { setOtpEmail, clearOtpEmail } = otpSlice.actions;
export default otpSlice.reducer;
