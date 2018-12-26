/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "aeb67e74b3b53675c16d7df7edbda317"
  },
  {
    "url": "api.html",
    "revision": "acc048b13f7b7bf266a04070764c2421"
  },
  {
    "url": "assets/css/0.styles.8c986673.css",
    "revision": "c03c854456154336c9893d7f73987bb1"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/2.415c2119.js",
    "revision": "8ac94c699dd7b378e3998b695f9db84f"
  },
  {
    "url": "assets/js/3.f2323fba.js",
    "revision": "446579dd1c41ced831fc8e03833712b8"
  },
  {
    "url": "assets/js/4.28d5a4e8.js",
    "revision": "91dd9c2fe6e43c3b1b226dccc9f4089d"
  },
  {
    "url": "assets/js/5.ac385614.js",
    "revision": "4750179b3ebab69c86633b1ca37bb607"
  },
  {
    "url": "assets/js/6.cd130bc8.js",
    "revision": "5a7d23e42c8df519ce525e08e3a0ad02"
  },
  {
    "url": "assets/js/7.5cef7884.js",
    "revision": "87b7c1ecd34ba2d55f2465b46ecb77e6"
  },
  {
    "url": "assets/js/app.dd05e687.js",
    "revision": "afb96fce849773a7c3ae22837fbc4a53"
  },
  {
    "url": "examples.html",
    "revision": "88d07f8a0531c76380e71a47092fb0c4"
  },
  {
    "url": "getting-started.html",
    "revision": "e57f67fef02daccaa302d96d972866cb"
  },
  {
    "url": "hooper.svg",
    "revision": "e138dfdb27cd6a48518049a5571ce28d"
  },
  {
    "url": "index.html",
    "revision": "cd97c9f51b42f67bf7d35df5d4f49a16"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
