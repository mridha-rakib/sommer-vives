/**
 * Shared chat notification helpers.
 *
 * - playMessageSound(): synthesised "ping" via WebAudio (no asset needed).
 *   Different roles get a slightly different tone so the sound signals who sent it.
 * - notifyNewMessage(): shows a desktop Notification when supported AND tab is hidden,
 *   plus plays the ping. Falls back gracefully when permission is denied.
 * - useChatNotifications(): stable hook returning a `notify(opts)` function that
 *   respects a per-user mute preference stored in localStorage.
 *
 * The audio context is created lazily on first user gesture (browsers require it).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { registerPushSubscription, useWebPushRegistration } from '@/lib/webPush';

type Role = 'admin' | 'owner' | 'guest';

const MUTE_KEY = 'sv:chat:muted';

let _audioCtx: AudioContext | null = null;
let _unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (_audioCtx) return _audioCtx;
  type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const audioWindow = window as AudioWindow;
  const Ctx: typeof AudioContext | undefined =
    audioWindow.AudioContext || audioWindow.webkitAudioContext;
  if (!Ctx) return null;
  try {
    _audioCtx = new Ctx();
  } catch {
    _audioCtx = null;
  }
  return _audioCtx;
}

/** Bind a one-time gesture handler so AudioContext can resume on iOS/Safari. */
export function bindAudioUnlock() {
  if (_unlockBound || typeof window === 'undefined') return;
  _unlockBound = true;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

/**
 * Play a short two-tone "ping" tuned per role.
 * - admin: warm bronze (525 → 700 Hz)
 * - owner: regal high (660 → 880 Hz)
 * - guest: soft mid   (520 → 660 Hz)
 */
export function playMessageSound(role: Role = 'guest') {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const tones: Record<Role, [number, number]> = {
    admin: [525, 700],
    owner: [660, 880],
    guest: [520, 660],
  };
  const [f1, f2] = tones[role];

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  // Envelope
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  const mkOsc = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 1;
    osc.connect(g).connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  };

  mkOsc(f1, 0, 0.18);
  mkOsc(f2, 0.12, 0.22);
}

/* -------------------------------------------------------------------------- */
/*  Mute preference                                                            */
/* -------------------------------------------------------------------------- */

export function isChatMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setChatMuted(muted: boolean) {
  if (typeof localStorage === 'undefined') return;
  if (muted) localStorage.setItem(MUTE_KEY, '1');
  else localStorage.removeItem(MUTE_KEY);
  window.dispatchEvent(new CustomEvent('sv:chat-mute-changed', { detail: { muted } }));
}

export function useChatMuted(): [boolean, (m: boolean) => void] {
  const [muted, setMuted] = useState<boolean>(() => isChatMuted());
  useEffect(() => {
    const onChange = (e: Event) => setMuted(((e as CustomEvent).detail?.muted) ?? isChatMuted());
    window.addEventListener('sv:chat-mute-changed', onChange);
    return () => window.removeEventListener('sv:chat-mute-changed', onChange);
  }, []);
  return [muted, (m: boolean) => setChatMuted(m)];
}

/* -------------------------------------------------------------------------- */
/*  Browser notification                                                       */
/* -------------------------------------------------------------------------- */

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

interface NotifyOptions {
  /** Who SENT the message (drives sound tone + notification title). */
  fromRole: Role;
  /** Display name of the sender. */
  fromName?: string | null;
  /** Body of the new message. */
  body: string;
  /** When true, force play even when document is visible. */
  alwaysPlay?: boolean;
  /** Click target (route) for the desktop notification. */
  url?: string;
}

/**
 * Fire-and-forget notification: plays the ping (unless muted) and shows a
 * native browser notification when the tab is in the background.
 */
export function notifyNewMessage(opts: NotifyOptions) {
  if (isChatMuted()) return;

  const visible = typeof document !== 'undefined' && document.visibilityState === 'visible';
  if (!visible || opts.alwaysPlay) {
    playMessageSound(opts.fromRole);
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !visible) {
    try {
      const titleMap: Record<Role, string> = {
        admin: 'SommerVibes Support',
        owner: 'Ny besked fra ejer',
        guest: 'Ny besked fra gæst',
      };
      const title = opts.fromName ? `${titleMap[opts.fromRole]} · ${opts.fromName}` : titleMap[opts.fromRole];
      const n = new Notification(title, {
        body: opts.body.slice(0, 140),
        tag: 'sv-chat',
        renotify: true,
      } as NotificationOptions);
      if (opts.url) {
        n.onclick = () => {
          try { window.focus(); } catch {
            // Window focus is best-effort.
          }
          window.location.href = opts.url!;
          n.close();
        };
      }
    } catch {
      // ignore
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  React hook                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One-call hook for any messaging page. Binds the audio unlock on first
 * mount and proactively asks for desktop-notification permission.
 *
 * Returns a stable `notify` reference plus mute controls.
 */
export function useChatNotifications(userId?: string | null) {
  const [muted, setMutedState] = useChatMuted();
  const notifyRef = useRef(notifyNewMessage);
  useWebPushRegistration(userId);

  useEffect(() => {
    bindAudioUnlock();
    // Ask for permission lazily — non-blocking.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      ensureNotificationPermission()
        .then(permission => {
          if (permission === 'granted' && userId) registerPushSubscription(userId).catch(() => {});
        })
        .catch(() => {});
    }
  }, [userId]);

  return useMemo(
    () => ({
      notify: (opts: NotifyOptions) => notifyRef.current(opts),
      muted,
      setMuted: (m: boolean) => setMutedState(m),
      requestPermission: ensureNotificationPermission,
    }),
    [muted, setMutedState]
  );
}
