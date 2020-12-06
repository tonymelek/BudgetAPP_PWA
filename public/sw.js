const staticCacheName = 'site-static';
const assets = ['/', '/icons/icon-192x192.png', '/icons/icon-512x512.png', '/app.js', '/index.js', '/styles.css', 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css']
//install event
self.addEventListener('install', (e) => {
    console.log('Service Worker has been installed');
    //cache assets at the change of application
    e.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('caching shell assets');
            cache.addAll(assets)
        })
    )
})

//activate event
self.addEventListener('activate', (e) => {
    console.log('Service worker has been activated');
})

//fetch event
self.addEventListener('fetch', e => {
    console.log('fetch event', e.request.url);
    e.respondWith(
        caches.match(e.request).then(cacheRes => {
            return cacheRes || fetch(e.request) //retuen from chache if exists if not try from the server.
        })
    )
})