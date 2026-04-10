import { useEffect } from 'react';
import api from '../utils/api';

export function usePush(user) {
  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        const { data } = await api.get('/api/push/vapid-key');
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });

        await api.post('/api/push/subscribe', { subscription: sub });
      } catch (e) {
        console.log('Push subscription failed:', e);
      }
    }

    if (Notification.permission === 'granted') {
      subscribe();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') subscribe();
      });
    }
  }, [user]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
