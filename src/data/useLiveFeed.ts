import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedStatus, ZoneReading } from '@/types';
import { WebSocketSource } from '@/data/WebSocketSource';

/**
 * Connects to the sensor gateway when `url` is set. Does nothing otherwise,
 * so the app stays in simulation mode.
 */
export function useLiveFeed(
  url: string | undefined,
  onReadings: (readings: ZoneReading[]) => void
) {
  const [status, setStatus] = useState<FeedStatus>(url ? 'connecting' : 'offline');
  const sourceRef = useRef<WebSocketSource | null>(null);
  const cbRef = useRef(onReadings);
  cbRef.current = onReadings;

  useEffect(() => {
    if (!url) return;
    const src = new WebSocketSource(url, (r) => cbRef.current(r), setStatus);
    sourceRef.current = src;
    src.start();
    return () => {
      src.stop();
      sourceRef.current = null;
    };
  }, [url]);

  const send = useCallback(
    (message: unknown) => sourceRef.current?.send(message) ?? false,
    []
  );

  return { status, send };
}
