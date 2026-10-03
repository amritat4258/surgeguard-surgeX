import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedStatus, ZoneReading } from '@/types';
import { WebSocketSource, type AppMessageCb } from '@/data/WebSocketSource';
import { resolveFeedUrl } from '@/data/feedUrl';

export type ConnectionMode = 'live' | 'local-only' | 'offline';

/**
 * Connects to the sensor gateway when `url` is set, and always activates
 * a BroadcastChannel for local cross-tab message synchronization.
 */
export function useLiveFeed(
  url: string | undefined,
  onReadings: (readings: ZoneReading[]) => void,
  onMessage?: AppMessageCb
) {
  const [status, setStatus] = useState<FeedStatus>(url ? 'connecting' : 'offline');
  const sourceRef = useRef<WebSocketSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const seenMessagesRef = useRef<Set<string>>(new Set());

  const cbRef = useRef(onReadings);
  cbRef.current = onReadings;
  const msgRef = useRef(onMessage);
  msgRef.current = onMessage;

  const handleIncomingMessage = useCallback((m: Record<string, unknown>) => {
    const msgId = typeof m.id === 'string' ? m.id : null;
    const msgKind = typeof m.kind === 'string' ? m.kind : '';
    const statusVal = typeof m.status === 'string' ? m.status : '';
    // For status updates, combine id and status for dedupe key
    const dedupeKey = msgId ? `${msgKind}-${msgId}-${statusVal}` : null;

    if (dedupeKey) {
      if (seenMessagesRef.current.has(dedupeKey)) return;
      seenMessagesRef.current.add(dedupeKey);
      // Cap dedupe cache size
      if (seenMessagesRef.current.size > 200) {
        const first = Array.from(seenMessagesRef.current)[0];
        seenMessagesRef.current.delete(first);
      }
    }

    msgRef.current?.(m);
  }, []);

  // BroadcastChannel for instant local cross-tab relay (fallback / companion)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      const bc = new BroadcastChannel('surgeguard-app-relay');
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          handleIncomingMessage(event.data as Record<string, unknown>);
        }
      };
      return () => {
        bc.close();
        broadcastChannelRef.current = null;
      };
    } catch {
      /* BroadcastChannel not available */
    }
  }, [handleIncomingMessage]);

  // WebSocket connection
  useEffect(() => {
    if (!url) return;
    const src = new WebSocketSource(
      resolveFeedUrl(url),
      (r) => cbRef.current(r),
      setStatus,
      (m) => handleIncomingMessage(m)
    );
    sourceRef.current = src;
    src.start();
    return () => {
      src.stop();
      sourceRef.current = null;
    };
  }, [url, handleIncomingMessage]);

  const send = useCallback((message: unknown): boolean => {
    let delivered = false;

    // 1. Try WebSocket relay
    if (sourceRef.current) {
      const ok = sourceRef.current.send(message);
      if (ok) delivered = true;
    }

    // 2. Also send via BroadcastChannel to other local tabs
    if (broadcastChannelRef.current && message && typeof message === 'object') {
      try {
        broadcastChannelRef.current.postMessage(message);
        delivered = true;
      } catch {
        /* ignore */
      }
    }

    return delivered;
  }, []);

  return { status, send };
}
