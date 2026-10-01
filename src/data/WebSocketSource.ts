// WebSocket client for the sensor gateway. Reconnects with backoff, ignores
// malformed messages, and flags the feed STALE when data stops arriving.

import type { FeedStatus, ZoneReading } from '@/types';
import { isValidReading } from '@/engine/live';
import { LIVE_STALE_AFTER_MS } from '@/config/scenario';

type ReadingsCb = (readings: ZoneReading[]) => void;
type StatusCb = (status: FeedStatus) => void;

export class WebSocketSource {
  private ws: WebSocket | null = null;
  private status: FeedStatus = 'offline';
  private retry = 0;
  private stopped = true;
  private lastMessageAt = 0;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private url: string,
    private onReadings: ReadingsCb,
    private onStatus: StatusCb
  ) {}

  start() {
    this.stopped = false;
    this.connect();
    this.watchdog = setInterval(() => {
      if (
        this.status === 'live' &&
        Date.now() - this.lastMessageAt > LIVE_STALE_AFTER_MS
      ) {
        this.setStatus('stale');
      }
    }, 1000);
  }

  stop() {
    this.stopped = true;
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.setStatus('offline');
  }

  /** Send a command to the gateway (e.g. an executed response plan). */
  send(message: unknown): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(message));
    return true;
  }

  private setStatus(s: FeedStatus) {
    if (s === this.status) return;
    this.status = s;
    this.onStatus(s);
  }

  private connect() {
    this.setStatus(this.retry === 0 ? 'connecting' : 'reconnecting');
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.lastMessageAt = Date.now();
      this.setStatus('live');
    };

    ws.onmessage = (ev) => {
      this.lastMessageAt = Date.now();
      if (this.status !== 'live') this.setStatus('live');
      let payload: unknown;
      try {
        payload = JSON.parse(String(ev.data));
      } catch {
        return; // ignore malformed frames
      }
      const items = Array.isArray(payload) ? payload : [payload];
      const valid = items.filter(isValidReading);
      if (valid.length > 0) this.onReadings(valid);
    };

    ws.onclose = () => {
      if (this.stopped) return;
      // backoff: 1s, 2s, 4s ... capped at 15s
      const delay = Math.min(1000 * 2 ** this.retry++, 15_000);
      this.setStatus('reconnecting');
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };

    ws.onerror = () => ws.close();
  }
}
