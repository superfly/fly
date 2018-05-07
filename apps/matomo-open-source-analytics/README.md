# Matomo for fly.io edge apps

The [official Matomo](https://github.com/matomo-org/matomo-nodejs-tracker) npm package didn't work for me, so I'm rewriting it to work in fly.io's [CDN](https://fly.io/articles/fly-edge-applications-global-javascript/) that you can program in Javascript.

The example lives in [`./index`](matomo-open-source-analytics/index.js). The actual tracking wrapper is in [`./tracker.js`](matomo-open-source-analytics/tracker.js), but you may want to peak at look at [Matomo for fly.io](https://github.com/OKNoah/matomo-fly), which I may update or put on NPM. The [`index.js`](https://github.com/OKNoah/matomo-fly/blob/master/index.js) file there represents this folder's `tracker.js`.


## Smash that issue button

Doesn't work for you? Visit [Matomo for Fly.io](https://github.com/OKNoah/matomo-fly) and let me know!