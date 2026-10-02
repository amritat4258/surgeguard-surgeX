import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CommandCenterProvider } from '@/state/CommandCenterProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CommandCenterProvider>
        <App />
      </CommandCenterProvider>
    </ThemeProvider>
  </StrictMode>
);
