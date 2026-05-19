/**
 * Lightweight dev-only logger.
 *
 * In production builds (`import.meta.env.DEV === false`) every call is a no-op,
 * so it's safe to leave instrumentation in the codebase.
 *
 * Each scope gets a colored, timestamped prefix in the browser console so
 * related events from the same subsystem are easy to follow.
 *
 * Usage:
 *   const log = devLog('chat:auto-read');
 *   log('marking N messages', { ids });
 *   log.warn('rls blocked', err);
 */

type Logger = ((message: string, ...data: unknown[]) => void) & {
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
  group: (label: string, fn: () => void) => void;
};

const COLORS = [
  '#A67C3D', '#3B82F6', '#10B981', '#EC4899',
  '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444',
];

const colorFor = (scope: string) => {
  let h = 0;
  for (let i = 0; i < scope.length; i++) h = (h * 31 + scope.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
};

const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true;

const noop = () => {};

export function devLog(scope: string): Logger {
  if (!isDev) {
    const fn: any = noop;
    fn.warn = noop;
    fn.error = noop;
    fn.group = (_label: string, body: () => void) => body();
    return fn;
  }

  const color = colorFor(scope);
  const style = `color:${color};font-weight:600`;
  const stamp = () => new Date().toISOString().split('T')[1].replace('Z', '');

  const base = (level: 'log' | 'warn' | 'error') =>
    (msg: string, ...data: unknown[]) =>
      console[level](`%c[${scope}]%c ${stamp()} — ${msg}`, style, 'color:inherit', ...data);

  const fn = base('log') as Logger;
  fn.warn = base('warn');
  fn.error = base('error');
  fn.group = (label, body) => {
    console.groupCollapsed(`%c[${scope}]%c ${label}`, style, 'color:inherit');
    try { body(); } finally {
      console.groupEnd();
    }
  };
  return fn;
}
