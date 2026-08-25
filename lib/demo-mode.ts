'use client';

import { useSyncExternalStore } from 'react';

const key = 'automateapply-demo-mode';
const event = 'automateapply-demo-mode-change';

function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(event, listener); window.removeEventListener('storage', listener); };
}

function snapshot() { return window.localStorage.getItem(key) === 'true' || document.cookie.split('; ').includes('automateapply-demo=1'); }

export function useDemoMode() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

export async function startDemoMode() {
  await fetch('/api/demo-session', { method: 'POST' });
  window.localStorage.setItem(key, 'true');
  window.dispatchEvent(new Event(event));
}

export async function endDemoMode() {
  await fetch('/api/demo-session', { method: 'DELETE' });
  window.localStorage.removeItem(key);
  window.dispatchEvent(new Event(event));
}
