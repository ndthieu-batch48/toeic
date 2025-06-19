import React from 'react';
import ReactDOM from 'react-dom/client';

import './assets/css/reset.css';
import './assets/css/style.css';
import './index.css';
import { Provider } from 'react-redux';

import App from './App';
import { store } from './redux/store.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import reportWebVitals from "./reportWebVitals";
// import "@fontsource/poppins/400.css";
// import "@fontsource/poppins/500.css";
// import "@fontsource/poppins/600.css";
// import "@fontsource/poppins/700.css";
// import "@fontsource/poppins/800.css";
// import "@fontsource/poppins/900.css";
// Thêm font Poppins bằng cách chèn <link> vào head
const link = document.createElement('link');
link.href =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App />
      {/* </React.StrictMode> */}
    </Provider>
  </QueryClientProvider>
);
