/* ---------------------------------------------------------
   Service Worker（ころたま）：オフラインでも ひらける ように ファイルを ためて おく
   ファイルを 変えたら CACHE_NAME を 上げる。ファイルを ふやしたら FILES にも。
   install は cache: 'reload'（GitHub Pages の 10分 キャッシュで 古い ファイルが 入るのを ふせぐ＝まなびモンスター v12.9.1 の 教訓）
   --------------------------------------------------------- */
const CACHE_NAME = 'manabi-tamago-v13';   // 名前は ころたま に なったが キャッシュ名の 頭は そのまま
const FONT_CACHE = 'manabi-tamago-fonts-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core/util.js', './js/core/stage.js', './js/core/blocks.js', './js/core/sfx.js', './js/core/save.js', './js/core/voice.js', './js/content/kakusu.js', './js/content/kotoba.js', './js/core/text.js', './js/core/trace.js', './js/core/cutout.js', './js/core/tasks.js',
  './js/content/charart.js', './js/content/presets.js',
  './js/ui/common.js', './js/ui/start.js', './js/ui/home.js', './js/ui/care.js', './js/ui/shop.js', './js/ui/play.js', './js/ui/kazu.js', './js/ui/kurabe.js', './js/ui/parent.js', './js/ui/boot.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) {
    return Promise.all(FILES.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* 1つ 落ちても 入れる */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME && k !== FONT_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  // 字（Google Fonts）は とって おく（オフラインで 字が 落ちない ように）
  if (/fonts\.(googleapis|gstatic)\.com/.test(url)) {
    e.respondWith(caches.open(FONT_CACHE).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) { if (res && res.ok) c.put(e.request, res.clone()); return res; }).catch(function () { return r; });
      });
    }));
    return;
  }
  if (/\/assets\/voice\//.test(e.request.url)) {   // 録音した 声（v0.1.7）：使った 文から キャッシュに 入れる
    e.respondWith(caches.open(CACHE_NAME).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) { if (res && res.ok) c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
self.addEventListener('message', function (e) {
  if (e.data === 'version' && e.source) e.source.postMessage({ version: CACHE_NAME });
});
