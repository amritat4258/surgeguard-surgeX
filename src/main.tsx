import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RoleChooser from '@/components/roles/RoleChooser';
import AttendeeApp from '@/components/attendee/AttendeeApp';
import { PhoneShell } from '@/components/attendee/PhoneShell';
import { CommandCenterProvider } from '@/state/CommandCenterProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { getRole, goToChooser } from '@/lib/role';
import './index.css';

// No ?role in the link  -> role chooser
// ?role=organizer       -> control-room dashboard (App brings its own provider)
// ?role=attendee        -> attendee phone app (phone-sized, always live)
const role = getRole();

const screen =
  role === 'organizer' ? (
    <App />
  ) : role === 'attendee' ? (
    <CommandCenterProvider role="attendee" forceLive>
      <PhoneShell>
        <AttendeeApp onExit={goToChooser} />
      </PhoneShell>
    </CommandCenterProvider>
  ) : (
    <RoleChooser />
  );

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>{screen}</ThemeProvider>
  </StrictMode>
);
