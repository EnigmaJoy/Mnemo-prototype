'use client';

import { useEffect } from 'react';

export default function StorageGuard() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    navigator.storage.persisted().then((already) => {
      if (already) return;
      navigator.storage.persist().catch(() => {});
    }).catch(() => {});
  }, []);

  return null;
}
