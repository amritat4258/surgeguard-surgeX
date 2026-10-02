import { useCallback, useState } from 'react';
import { DEFAULT_POSITION, clampToVenue, type Point } from '@/data/venueGeometry';

const KEY = 'surgeguard-attendee-position';

function load(): Point | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Point> | null;
    if (v && typeof v.x === 'number' && typeof v.y === 'number') {
      return clampToVenue({ x: v.x, y: v.y });
    }
  } catch {
    /* storage unavailable or bad data: fall back to default */
  }
  return null;
}

/** The attendee's pinned position on the venue map, remembered on this phone. */
export function useMyPosition() {
  const [saved, setSaved] = useState<Point | null>(load);

  const setPosition = useCallback((p: Point) => {
    const clamped = clampToVenue(p);
    setSaved(clamped);
    try {
      localStorage.setItem(KEY, JSON.stringify(clamped));
    } catch {
      /* ignore */
    }
  }, []);

  const clearPosition = useCallback(() => {
    setSaved(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    position: saved ?? DEFAULT_POSITION,
    isSet: saved !== null,
    setPosition,
    clearPosition,
  };
}
