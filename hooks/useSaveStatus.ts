'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';

export function useSaveStatus() {
  const suites = useStore(s => s.suites);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setStatus('saving');
    const t = setTimeout(() => setStatus('saved'), 600);
    const t2 = setTimeout(() => setStatus('idle'), 2400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [suites]);

  return status;
}