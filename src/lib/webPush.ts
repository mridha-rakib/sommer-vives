import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

type PushRegistrationResult =
  | { status: 'registered'; subscriptionId?: string }
  | { status: 'skipped'; reason: string };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function registerPushSubscription(userId: string): Promise<PushRegistrationResult> {
  if (!VAPID_PUBLIC_KEY) return { status: 'skipped', reason: 'missing_vapid_public_key' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { status: 'skipped', reason: 'push_not_supported' };
  }
  if (typeof Notification === 'undefined') return { status: 'skipped', reason: 'notifications_not_supported' };
  if (Notification.permission !== 'granted') return { status: 'skipped', reason: `permission_${Notification.permission}` };

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { status: 'skipped', reason: 'invalid_subscription' };
  }

  const { data, error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
    disabled_at: null,
  }, { onConflict: 'endpoint' }).select('id').single();

  if (error) throw error;
  return { status: 'registered', subscriptionId: data?.id };
}

export function useWebPushRegistration(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    registerPushSubscription(userId).catch(error => {
      console.warn('[push] registration failed', error);
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        registerPushSubscription(userId).catch(error => {
          console.warn('[push] registration failed', error);
        });
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId]);
}
