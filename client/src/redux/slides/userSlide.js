import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: '',
  userName: '',
  userEmail: '',
  access_token: '',
  refresh_token: '', // Thêm refresh_token
  role: '', // Thêm role
  isLoggedIn: false,
  isStudent: false,
  allUser: [],
  detailUser: {},
  isTestPage: false,
  alertBox: {
    msg: '',
    error: false,
    open: false,
  },
  isAuthInitialized: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action) => {
      const {
        id = '',
        userName = '',
        userEmail = '',
        access_token = '',
        refresh_token = '',
        role = '',
        isStudent = false,
        isLoggedIn = false,
        isAuthInitialized = state.isAuthInitialized,
      } = action?.payload;
      state.id = id;
      state.userName = userName || userEmail;
      state.userEmail = userEmail;
      state.access_token = access_token;
      state.refresh_token = refresh_token;
      state.role = role;
      // state.isLoggedIn = !!access_token;
      state.isLoggedIn = isLoggedIn;
      state.isStudent = isStudent;
      state.isAuthInitialized = isAuthInitialized;
    },
    resetUser: (state) => {
      state.id = '';
      state.userName = '';
      state.userEmail = '';
      state.access_token = '';
      state.refresh_token = '';
      state.role = '';
      state.isLoggedIn = false;
      state.isStudent = false;
      state.isTestPage = false;
      state.isAuthInitialized = true;
    },
    setAllUser: (state, action) => {
      state.allUser = action.payload;
    },
    setDetailUser: (state, action) => {
      state.detailUser = action.payload;
    },
    setIsTestPage: (state, action) => {
      state.isTestPage = action.payload;
    },
    setAlertBox: (state, action) => {
      state.alertBox = action.payload;
    },
    setAuthInitialized: (state, action) => {
      state.isAuthInitialized = action.payload;
    },
  },
});

export const {
  updateUser,
  resetUser,
  setAllUser,
  setDetailUser,
  setIsTestPage,
  setAlertBox,
  setAuthInitialized,
} = userSlice.actions;
export default userSlice.reducer;
