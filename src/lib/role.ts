export type Role = 'organizer' | 'attendee' | 'camera';

/** Reads the role from the page link: ?role=organizer, ?role=attendee, or ?role=camera. Null means "show the chooser". */
export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role') || params.get('page') || params.get('view');
  if (role === 'organizer' || role === 'attendee') return role;
  if (role === 'camera' || role === 'cctv') return 'camera';
  return null;
}

/** Link that opens the app as the given role. */
export function roleHref(role: Role): string {
  return `?role=${role}`;
}

/** Back to the role chooser. */
export function goToChooser(): void {
  window.location.assign(window.location.pathname);
}