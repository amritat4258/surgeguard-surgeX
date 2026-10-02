import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RoleChooser from '@/components/roles/RoleChooser';
import AttendeeAppModal from '@/components/attendee/AttendeeAppModal';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { getRole, goToChooser } from '@/lib/role';
import './index.css';

// No ?role in the link  -> role chooser
// ?role=organizer       -> control-room dashboard (App brings its own provider)
// ?role=attendee        -> attendee phone app
const role = getRole();

const screen =
  role === 'organizer' ? (
    <App />
  ) : role === 'attendee' ? (
    <AttendeeAppModal isOpen onClose={goToChooser} />
  ) : (
    <RoleChooser />
  );

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>{screen}</ThemeProvider>
  </StrictMode>
);