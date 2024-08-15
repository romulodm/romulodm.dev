import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

import { PortfolioThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from '@mui/system';
import { theme } from './theme/theme.js';

import './i18next.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={`${GOOGLE_CLIENT_ID}`}>
    <ThemeProvider theme={theme}>
      <ToastProvider>
          <PortfolioThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
          </PortfolioThemeProvider>
      </ToastProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
)