import { useEffect, useRef, useState } from 'react';
import { usePushLocationMutation } from '../../api/api';

const MIN_INTERVAL_MS = 8000;

// Streams the mover's device GPS to the server while `enabled`.
export default function useShareLocation(bookingId, enabled) {
  const [push] = usePushLocationMutation();
  const [state, setState] = useState({ sharing: false, error: '', last: null });
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled) { setState((s) => ({ ...s, sharing: false })); return; }
    if (!navigator.geolocation) { setState({ sharing: false, error: 'GPS is not available on this device.', last: null }); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const point = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        setState({ sharing: true, error: '', last: point });
        if (now - lastSent.current < MIN_INTERVAL_MS) return;
        lastSent.current = now;
        push({ id: bookingId, ...point, heading: pos.coords.heading, speed: pos.coords.speed });
      },
      (err) => setState({ sharing: false, error: err.code === 1 ? 'Location permission denied. Enable it in your browser settings.' : 'Could not read GPS.', last: null }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, bookingId, push]);

  return state;
}
