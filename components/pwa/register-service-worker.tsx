"use client";

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (!window.isSecureContext) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // Registro silencioso para no interferir con el flujo actual.
      }
    };

    if (document.readyState === 'complete') {
      void register();
      return;
    }

    const onLoad = () => {
      void register();
    };

    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
