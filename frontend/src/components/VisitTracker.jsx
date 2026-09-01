import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Mencatat page view setiap kali rute berubah.
 * Dipasang sekali di dalam <Router>.
 */
export default function VisitTracker() {
  const location = useLocation();
  const lastPathRef = useRef(null);

  useEffect(() => {
    // Hindari double-track karena StrictMode
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;

    api
      .post('/track-visit', {
        path: location.pathname,
        referrer: document.referrer || null,
      })
      .catch(() => {
        // Abaikan kegagalan tracking (misal saat offline)
      });
  }, [location.pathname]);

  return null;
}