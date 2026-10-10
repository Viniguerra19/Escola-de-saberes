// Retira um worker legado instalado neste mesmo endereço da Escola.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    for (const tab of tabs) {
      if (tab.url.startsWith(self.registration.scope)) await tab.navigate(tab.url);
    }
  })());
});
