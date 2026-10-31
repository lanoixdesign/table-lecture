/* Table de lecture — service worker (hors connexion).
   - Coquille de l'appli : pré-cache versionné (tl-shell-<version>), servie depuis le cache.
   - Modèles d'IA et bibliothèques (CDN, Hugging Face, Google Storage) : cache d'abord (tl-models-1).
   - Données en ligne (météo, Open*Facts, Wikipédia/Wikidata, guide TV…) : réseau d'abord, cache en secours (tl-data-1).
   Seules les réponses OK et lisibles (same-origin ou CORS) sont mises en cache, jamais les réponses opaques. */
const VER = "5.9.2";
const SHELL = "tl-shell-" + VER, MODELS = "tl-models-1", DATA = "tl-data-1";
const KEEP = [SHELL, MODELS, DATA];
const SHELL_FILES = ["./", "index.html", "credits.html", "vocab.json", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-32.png"];
const MODEL_HOST = /(^|\.)(jsdelivr\.net|unpkg\.com|storage\.googleapis\.com|tfhub\.dev|kaggle\.com|kaggleusercontent\.com|huggingface\.co|hf\.co|projectnaptha\.com)$/;
const DATA_HOST = /(^|\.)(open-meteo\.com|bigdatacloud\.net|openfoodfacts\.org|openbeautyfacts\.org|openpetfoodfacts\.org|openproductsfacts\.org|wikipedia\.org|wikidata\.org|wikimedia\.org|xmltvfr\.fr|themoviedb\.org|tmdb\.org)$/;
const DATA_MAX = 250;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES.map(u => new Request(u, { cache: "reload" })))));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("tl-") && !KEEP.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "SKIP_WAITING") self.skipWaiting();
  if (d.type === "VERSION" && e.ports[0]) e.ports[0].postMessage(VER);
});

const okToCache = r => r && r.ok && r.status === 200 && (r.type === "basic" || r.type === "cors" || r.type === "default");
async function put(cacheName, key, res) {
  try { const c = await caches.open(cacheName); await c.put(key, res); } catch (err) { /* quota dépassé : on ignore */ }
}
async function trim(cacheName, max) {
  const c = await caches.open(cacheName), keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function shellFirst(req) {
  const c = await caches.open(SHELL);
  const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./") : null);
  if (hit) return hit;
  try { return await fetch(req); } catch (err) { return (await c.match("./")) || Response.error(); }
}
async function modelFirst(req) {
  const key = req.url;
  const hit = await caches.match(key, { cacheName: MODELS });
  if (hit) return hit;
  // Requête refaite en mode CORS (même pour les <script> sans crossorigin) pour obtenir une réponse lisible et cachable.
  const res = await fetch(new Request(key, { mode: "cors", credentials: "omit", redirect: "follow" }));
  if (okToCache(res)) put(MODELS, key, res.clone());
  return res;
}
async function dataNetFirst(req) {
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 9000))]);
    if (okToCache(res)) { await put(DATA, req.url, res.clone()); trim(DATA, DATA_MAX); }
    return res;
  } catch (err) {
    const hit = await caches.match(req.url, { cacheName: DATA });
    if (hit) { const h = new Headers(hit.headers); h.set("X-TL-From-Cache", "1");
      return new Response(await hit.blob(), { status: hit.status, statusText: hit.statusText, headers: h }); }
    return Response.error();
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  if (url.origin === self.location.origin) {
    const scopePath = new URL(self.registration.scope).pathname;
    const rel = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : null;
    if (rel === null) return;
    if (req.mode === "navigate" || SHELL_FILES.includes(rel || "./") || rel === "") {
      if (url.searchParams.has("nv")) return; // vérification de version explicite : réseau
      e.respondWith(shellFirst(req)); return;
    }
    e.respondWith(dataNetFirst(req)); return;
  }
  if (MODEL_HOST.test(url.hostname)) { e.respondWith(modelFirst(req).catch(() => Response.error())); return; }
  if (DATA_HOST.test(url.hostname)) { e.respondWith(dataNetFirst(req)); return; }
});
