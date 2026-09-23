import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

// autoUpdate + skipWaiting/clientsClaim means a detected update activates and
// reloads automatically — the periodic registration.update() call here just
// makes sure it's actually *checked* often while the app is open, instead of
// only on the next cold navigation (which could otherwise leave an installed
// PWA silently running a stale build for a long time).
export function setupServiceWorkerUpdates() {
  if (!("serviceWorker" in navigator)) return;

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });
}
