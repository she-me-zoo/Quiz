const CACHE = "chikusan-quiz-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./manifest.json"
];

// インストール時に全アセットをキャッシュ
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        // キャッシュ失敗しても install は通す
        console.warn("Cache install failed:", err);
        return self.skipWaiting();
      })
  );
});

// 古いキャッシュを削除
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Network First（ネットワーク優先）戦略
// → 通信できればフレッシュなファイルを返す
// → オフライン or 失敗時のみキャッシュから返す
self.addEventListener("fetch", e => {
  // chrome-extension や非HTTPリクエストはスルー
  if (!e.request.url.startsWith("http")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 正常レスポンスはキャッシュにも保存
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(e.request)
          .then(cached => cached || caches.match("./index.html"));
      })
  );
});
