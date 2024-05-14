import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import { ThemeProvider } from '@mui/system';
import { theme } from './theme/theme.js';

import './i18next.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
      <App />
  </ThemeProvider>
)