import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';
import { TokenManagerProvider } from '@/components/auth/TokenManagerProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <TokenManagerProvider>
        <App />
      </TokenManagerProvider>
    </Router>
    <Toaster />
  </StrictMode>
);
