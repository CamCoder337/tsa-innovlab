import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { TokenManagerProvider } from '@/components/auth/TokenManagerProvider';
import { NotificationProvider } from './components/notifications/NotificationProvider.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <Router>
    <ThemeProvider>
      <TokenManagerProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </TokenManagerProvider>
    </ThemeProvider>
  </Router>
);
