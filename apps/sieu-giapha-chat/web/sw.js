/* Service worker: chạy offline. Trang và tệp của app: mạng trước, lỗi thì dùng bản lưu.
 * Thư viện CDN và phông chữ: dùng bản lưu, cập nhật ngầm. Không lưu yêu cầu tới máy chủ dữ liệu hay AI. */
const V = "sgp-v2";
const CORE = ["./", "index.html", "sgp-runtime.js", "config.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "vendor/supabase-js-2.118.0.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || /supabase\.co$|anthropic\.com$/.test(u.hostname)) return;
  const cdn = /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(u.hostname);
  if (cdn) {
    e.respondWith(caches.open(V).then(async (c) => { const hit = await c.match(e.request); const net = fetch(e.request).then((r) => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => hit); return hit || net; }));
  } else if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) caches.open(V).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request).then((h) => h || caches.match("index.html"))));
  }
});
