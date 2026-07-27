import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVehicles, getToken, subscribeVehicles } from '../api.js';

const POLL_MS = 5000;

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [connectionMode, setConnectionMode] = useState('connecting');
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const gotSseRef = useRef(false);

  const applyData = useCallback((data) => {
    setVehicles(Array.isArray(data) ? data : []);
    setLastUpdatedAt(Date.now());
    setError(null);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    if (!getToken()) return;

    const tick = async () => {
      try {
        const data = await fetchVehicles();
        applyData(data);
        setConnectionMode('polling');
      } catch (err) {
        setError(err.message);
        if (String(err.message).includes('Sesión expirada')) {
          stopPolling();
        }
      }
    };

    tick();
    pollRef.current = setInterval(tick, POLL_MS);
  }, [applyData, stopPolling]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeVehicles(
      (data) => {
        if (cancelled) return;
        gotSseRef.current = true;
        stopPolling();
        applyData(data);
        setConnectionMode('sse');
      },
      () => {
        if (cancelled) return;
        if (!pollRef.current && getToken()) {
          startPolling();
        }
      },
    );

    const fallbackTimer = setTimeout(() => {
      if (!cancelled && !gotSseRef.current && getToken()) {
        startPolling();
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      unsubscribe();
      stopPolling();
    };
  }, [applyData, startPolling, stopPolling]);

  return { vehicles, lastUpdatedAt, connectionMode, error };
}
