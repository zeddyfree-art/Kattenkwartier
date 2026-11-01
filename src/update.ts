/**
 * Update notice. Every build gets a unique id; the published site has a
 * version.json with the newest id. When they differ, we show a banner.
 */

declare const __BUILD_ID__: string;
declare const __APP_VERSION__: string;

export const BUILD_ID = __BUILD_ID__;
export const APP_VERSION = __APP_VERSION__;

/** Newest first. Shown once after an update. */
export const CHANGELOG: { version: string; items: string[] }[] = [
  {
    version: '0.2.0',
    items: [
      '100 levels in 5 werelden, steeds moeilijker (10×10)',
      'Score, sterren, high scores en kattentitels',
      'Hints in stapjes: Waar? → Waarom? → Doe maar',
      'Een foute kat zie je meteen (kost wel punten)',
      'Automatische kruisjes zijn nu even groot als je eigen kruisjes',
      'Melding als er een nieuwe update is',
    ],
  },
  { version: '0.1.0', items: ['Eerste speelbare versie'] },
];

let shown = false;

async function check(onUpdate: () => void) {
  if (shown || import.meta.env.DEV) return;
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { build } = (await res.json()) as { build: string };
    if (build && build !== BUILD_ID) {
      shown = true;
      onUpdate();
    }
  } catch {
    /* offline: try again later */
  }
}

export function watchForUpdates(onUpdate: () => void) {
  void check(onUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check(onUpdate);
  });
  setInterval(() => void check(onUpdate), 15 * 60 * 1000);
}

export async function applyUpdate() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    /* ignore */
  }
  location.reload();
}
