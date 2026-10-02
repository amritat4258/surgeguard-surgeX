export type Role = 'organizer' | 'attendee';

/** Reads the role from the page link: ?role=organizer or ?role=attendee. Null means "show the chooser". */
export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  if (role === 'organizer' || role === 'attendee') return role;
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