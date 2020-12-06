const staticCacheName = 'site-static';
const dataCacheName = 'data-cache';
const assets = ['/', '/icons/icon-192x192.png', '/icons/icon-512x512.png', '/app.js', '/index.js', '/styles.css', 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css', 'https://code.jquery.com/jquery-3.5.1.min.js']
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
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== staticCacheName && key !== dataCacheName) {
                        return caches.delete(key)
                    }
                })
            )
        })
    )
    console.log('Service worker has been activated');
    self.clients.claim();
})

//fetch event
self.addEventListener('fetch', e => {
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            caches.open(dataCacheName).then(cache => {
                return fetch(e.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(e.request.url, response.clone());
                        } else {
                            console.log('server down');
                        }
                        return response
                    })
                    .catch(err => {
                        return cache.match(e.request)
                    })
            })
        )
    }
    else {
        e.respondWith(
            caches.match(e.request).then(cacheRes => {
                return cacheRes || fetch(e.request) //retuen from chache if exists if not try from the server.
            })
        )
    }
})