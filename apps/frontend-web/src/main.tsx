import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { TokenManagerProvider } from '@/components/auth/TokenManagerProvider';
import { NotificationProvider } from './components/notifications/NotificationProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <Router>
    <TokenManagerProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </TokenManagerProvider>
  </Router>
);
