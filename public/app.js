//register service-worker if supported by the browser
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker has been registered'))
        .catch(err => console.log(err));
}