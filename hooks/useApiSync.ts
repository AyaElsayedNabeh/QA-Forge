'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useApiSync(enabled = false) {
  const suites = useStore(s => s.suites);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/suites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suites }),
        });
      } catch (e) {
        console.warn('API sync failed (local storage still works):', e);
      }
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [suites, enabled]);
}