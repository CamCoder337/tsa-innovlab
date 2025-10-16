import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';
import { TokenManagerProvider } from '@/components/auth/TokenManagerProvider';
import { NotificationProvider } from './components/notifications/NotificationProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <TokenManagerProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </TokenManagerProvider>
    </Router>
    <Toaster />
  </StrictMode>
);
