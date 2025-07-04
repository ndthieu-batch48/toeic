import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  alertBox: {
    msg: '',
    type: '',
    error: false,
    open: false,
  },
};

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlertBox: (state, action) => {
      state.alertBox = { ...state.alertBox, ...action.payload };
    },
    closeAlertBox: (state) => {
      state.alertBox.open = false;
    },
    resetAlertBox: (state) => {
      state.alertBox = {
        msg: '',
        type: '',
        error: false,
        open: false,
      };
    },
  },
});

export const { setAlertBox, closeAlertBox, resetAlertBox } = alertSlice.actions;
export default alertSlice.reducer;
