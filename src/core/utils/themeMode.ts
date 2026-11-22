export type ThemeMode = 'dark' | 'light';

const COLOR_SCHEME_STORAGE_KEY = 'color-scheme';

export function getActiveThemeMode(): ThemeMode {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme;
    if (attr === 'light') return 'light';
    if (attr === 'dark') return 'dark';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (meta?.content === 'light') return 'light';
  }
  try {
    const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (stored === 'light') return 'light';
  } catch {}
  return 'dark';
}

export function applyThemeMode(target: ThemeMode, persist = true): void {
  const meta =
    typeof document !== 'undefined'
      ? document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
      : null;
  const systemPrefersLight =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;

  if (persist) {
    try {
      if (target === 'dark' && !systemPrefersLight) {
        localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
        if (meta) meta.content = 'light dark';
      } else {
        localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, target);
        if (meta) meta.content = target;
      }
    } catch {
      if (meta) meta.content = target;
    }
  } else if (meta) {
    meta.content = target;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = target;
    if (target === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }
}
