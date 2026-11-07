// 离线缓存。程序文件的缓存名带版本号；中文字体单独一个缓存（文件名是内容摘要，改版本也不用重新下载）；文章和备份在 IndexedDB，不在这里
const CACHE = "chaiwen-v0.8.0", FONTS = "chaiwen-fonts";
const ZH = {"core": ["fonts/zh-2442e54e28a4.woff2", "fonts/zh-9832cf2db248.woff2", "fonts/zh-4248558d8e32.woff2", "fonts/zh-4985feed9a44.woff2", "fonts/zh-1d6278b9f39c.woff2", "fonts/zh-12660e346bc9.woff2", "fonts/zh-aa28d05f67cd.woff2", "fonts/zh-b385ec093162.woff2", "fonts/zh-e02621d52950.woff2", "fonts/zh-d988a7c0e8ad.woff2", "fonts/zh-05d1b4c85e15.woff2", "fonts/zh-a5937dc3183b.woff2", "fonts/zh-50d97de7663e.woff2", "fonts/zh-8bb094e26d22.woff2", "fonts/zh-14bf509f332c.woff2", "fonts/zh-861e9ed91ab1.woff2", "fonts/zh-3a6923727867.woff2", "fonts/zh-0069bf31d43c.woff2", "fonts/zh-01aa0d119e80.woff2", "fonts/zh-2f3848911b2e.woff2", "fonts/zh-38948f5ff5b1.woff2", "fonts/zh-15805b96cbed.woff2", "fonts/zh-86dd2c68ebea.woff2", "fonts/zh-5d69ca8c2cbe.woff2", "fonts/zh-0f6466ff8217.woff2", "fonts/zh-31a5bd93884b.woff2"], "extra": ["fonts/zh-1ebafba9e79d.woff2", "fonts/zh-e2bee35a9b85.woff2", "fonts/zh-07e16b82e19f.woff2", "fonts/zh-65cdc6085a17.woff2", "fonts/zh-00a96476e7ca.woff2", "fonts/zh-117f83bc31cf.woff2", "fonts/zh-e03e2e4ddc0e.woff2", "fonts/zh-7000598ae1d3.woff2", "fonts/zh-f2d3b258f2e7.woff2", "fonts/zh-673d6b540653.woff2", "fonts/zh-2ffb79fc3c74.woff2", "fonts/zh-3d88e2675683.woff2", "fonts/zh-a37cc1d5960d.woff2", "fonts/zh-441ead1a06cf.woff2", "fonts/zh-771c1921af6d.woff2", "fonts/zh-29c94ff5570a.woff2", "fonts/zh-61956ce730d1.woff2", "fonts/zh-d7a2455318ca.woff2", "fonts/zh-7ab4644774f0.woff2", "fonts/zh-4ca8cfea8c75.woff2", "fonts/zh-f55943797823.woff2", "fonts/zh-330722a52752.woff2", "fonts/zh-5853a9984bcc.woff2", "fonts/zh-9cc4f43ca975.woff2", "fonts/zh-ce681edea032.woff2", "fonts/zh-2a0e8906e9f1.woff2", "fonts/zh-e516d4c13bf6.woff2", "fonts/zh-d8596f241c3f.woff2", "fonts/zh-d746af43016c.woff2", "fonts/zh-292143d1c44e.woff2", "fonts/zh-b21ddc6c19ed.woff2"]}; // core：安装时必须存好；extra：常用字库，用到才取，页面空闲时也会在后台存好
const FILES = ["./", "index.html", "manifest.webmanifest", "changelog.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => e.waitUntil(Promise.all([
  caches.open(CACHE).then(c => c.addAll(FILES)),
  caches.open(FONTS).then(c => Promise.all(ZH.core.map(f => c.match(f).then(m => m || c.add(f)).catch(() => {})))) // 字体没下完不影响程序更新，用到时再取
]).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(Promise.all([
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("chaiwen-") && k != CACHE && k != FONTS).map(k => caches.delete(k)))),
  caches.open(FONTS).then(c => c.keys().then(rs => Promise.all(rs.filter(r => !ZH.core.concat(ZH.extra).some(f => r.url.endsWith("/" + f))).map(r => c.delete(r)))))
]).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method != "GET" || new URL(e.request.url).origin != location.origin) return;
  const p = new URL(e.request.url).pathname;
  if (p.includes("/articles/")) return; // 同步的文章只存在 IndexedDB，不进缓存
  if (p.includes("/fonts/")) { // 字体：先看缓存，没有再联网取并存下
    e.respondWith(caches.open(FONTS).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(m => m || caches.match("index.html"))));
});
