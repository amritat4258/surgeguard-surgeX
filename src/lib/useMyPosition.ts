import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_POSITION,
  clampToVenue,
  gpsToVenuePoint,
  type Point,
} from '@/data/venueGeometry';

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

export type GpsStatus = 'idle' | 'locating' | 'active' | 'denied' | 'outside_venue' | 'unsupported';

/** The attendee's pinned position on the venue map, remembered on this phone, with GPS sensor support. */
export function useMyPosition() {
  const [saved, setSaved] = useState<Point | null>(load);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const setPosition = useCallback((p: Point) => {
    const clamped = clampToVenue(p);
    setSaved(clamped);
    setIsGpsActive(false); // manual tap overrides live GPS lock
    try {
      localStorage.setItem(KEY, JSON.stringify(clamped));
    } catch {
      /* ignore */
    }
  }, []);

  const clearPosition = useCallback(() => {
    setSaved(null);
    setIsGpsActive(false);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const requestGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      setGpsError('Geolocation is not supported on this browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const venuePoint = gpsToVenuePoint(latitude, longitude);
        if (venuePoint) {
          setPosition(venuePoint);
          setIsGpsActive(true);
          setGpsStatus('active');
          setGpsError(null);
        } else {
          setGpsStatus('outside_venue');
          setGpsError('GPS indicates you are outside MMRDA Grounds BKC. Using venue manual pin.');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsError('Location permission denied. Tap the venue map to pin your position.');
        } else {
          setGpsStatus('idle');
          setGpsError('GPS signal unavailable. Tap the map to set location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, [setPosition]);

  // Continuously watch position if GPS is activated
  useEffect(() => {
    if (!isGpsActive || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const venuePoint = gpsToVenuePoint(pos.coords.latitude, pos.coords.longitude);
        if (venuePoint) {
          setSaved(venuePoint);
          setGpsStatus('active');
        } else {
          setGpsStatus('outside_venue');
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isGpsActive]);

  return {
    position: saved ?? DEFAULT_POSITION,
    isSet: saved !== null,
    isGpsActive,
    gpsStatus,
    gpsError,
    requestGps,
    setPosition,
    clearPosition,
  };
}
