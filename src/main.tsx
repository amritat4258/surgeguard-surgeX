import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CommandCenterProvider } from '@/state/CommandCenterProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CommandCenterProvider>
      <App />
    </CommandCenterProvider>
  </StrictMode>
);
