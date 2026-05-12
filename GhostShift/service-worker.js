const CACHE_NAME = "ghostshift-static-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./signup.html",
  "./signin.html",
  "./logout.html",
  "./dashboard.html",
  "./demo-player.html",
  "./install.html",
  "./install.js",
  "./privacy.html",
  "./terms.html",
  "./demo-player.css",
  "./demo-player.js",
  "./mobile-app/PWA_INSTALL.md",
  "./styles.css",
  "./script.js",
  "./account.js",
  "./manifest.webmanifest",
  "./assets/ghostshift-icon.svg",
  "./roadmap.md",
  "./mobile-app/README.md"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
