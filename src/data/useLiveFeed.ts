import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedStatus, ZoneReading } from '@/types';
import { WebSocketSource, type AppMessageCb } from '@/data/WebSocketSource';
import { resolveFeedUrl } from '@/data/feedUrl';

/**
 * Connects to the sensor gateway when `url` is set. Does nothing otherwise,
 * so the app stays in simulation mode. `onMessage` receives app messages
 * (anything with a string `kind`); validate them with parseAppMessage.
 */
export function useLiveFeed(
  url: string | undefined,
  onReadings: (readings: ZoneReading[]) => void,
  onMessage?: AppMessageCb
) {
  const [status, setStatus] = useState<FeedStatus>(url ? 'connecting' : 'offline');
  const sourceRef = useRef<WebSocketSource | null>(null);
  const cbRef = useRef(onReadings);
  cbRef.current = onReadings;
  const msgRef = useRef(onMessage);
  msgRef.current = onMessage;

  useEffect(() => {
    if (!url) return;
    const src = new WebSocketSource(
      resolveFeedUrl(url),
      (r) => cbRef.current(r),
      setStatus,
      (m) => msgRef.current?.(m)
    );
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
