import type { ReactNode } from 'react';

interface PhoneShellProps {
  children: ReactNode;
}

/**
 * On a real phone (< 640px wide): full screen.
 * On a laptop: a centred 390px phone frame.
 * The transform makes `position: fixed` children (SOS bar, SOS sheet)
 * stay inside the frame instead of covering the whole browser window.
 */
export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div
      data-theme="dark"
      className="flex min-h-[100dvh] items-center justify-center bg-slate-900 sm:p-4"
    >
      <div
        className="relative w-full overflow-hidden bg-slate-950 sm:w-[390px] sm:rounded-[2.5rem] sm:border-[8px] sm:border-slate-700 sm:shadow-2xl"
        style={{
          transform: 'translateZ(0)',
          height: 'min(100dvh, 844px)',
        }}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}