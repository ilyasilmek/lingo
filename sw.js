// Eski web sürümünün (1.54.02) service worker'ını kaldırır.
// O sürüm sayfayı ve dosyaları tarayıcı önbelleğinde tutuyor ve her açılışta önce onları
// gösteriyordu; bu yüzden eski sürümü bir kez açmış olanlar yeni oyunu göremiyordu.
// Tarayıcı güncelleme için bu dosyayı indirince eski önbellek silinir, kayıt kaldırılır ve
// açık sekmeler yeni sürümle yeniden yüklenir. Yeni sürüm service worker kullanmaz.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('lingo:')) await caches.delete(name);
    }
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      client.navigate(client.url);
    }
  })());
});
