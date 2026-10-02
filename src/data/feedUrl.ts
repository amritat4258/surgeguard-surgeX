/**
 * On a phone, "localhost" means the phone itself. If the configured feed URL
 * points at localhost but the page was opened via the laptop's address
 * (e.g. 192.168.1.20), use that address instead.
 */
export function resolveFeedUrl(raw: string): string {
  if (typeof window === 'undefined') return raw;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') return raw;
  return raw.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${host}`);
}
