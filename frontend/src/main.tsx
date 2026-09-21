import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import PolicyManagementPage from './features/admin/policy/pages/PolicyManagementPage';
import PolicyHistoryPage from './features/admin/policy/pages/PolicyHistoryPage';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
);
