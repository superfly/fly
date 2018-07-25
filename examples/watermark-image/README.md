# Watermark Images

This Fly App example demonstrates a powerful capability the Image API. It grabs a photo of a hot air balloon, and then "watermarks" it with the Fly logo. Like this:

![Watermarked balloon](https://user-images.githubusercontent.com/7724/38442073-a2e17202-39ac-11e8-9798-93393f7dc847.jpeg)

## Try it out

```bash
npm install -g @fly/fly
fly new watermark-image -t watermark-image
cd watermark-image
fly server
```

Then open http://localhost:3000

## Make some changes

```bash
cd watermark-image
open index.js
```

## How it works

The code [fetches both images](https://github.com/superfly/fly/blob/master/examples/watermark-image/index.js#L17-L20) in parallel, using the built in `Promise.all` support.

Once it has the source image (the `picture` constant in the code) and the watermark file (the `logo` constant), it [adds padding](https://github.com/superfly/fly/blob/master/examples/watermark-image/index.js#L24-L32) to the watermark to give it a little room to breathe once it's place on the picture.

Padding an image requires two functions, `extend` to make the canvas larger, and `background` to specify a canvas background color (in this case, transparent).

Once it has a nicely padded watermark, it uses `picture.overlayWith` function to draw the watermark onto the original picture. This function has a `gravity` option to control positioning, by default it would put the watermark in the center, passing `Image.gravity.southeast` puts it on the bottom right instead.

Returning the watermarked picture to a user is [as simple as](https://github.com/superfly/fly/blob/master/examples/watermark-image/index.js#L36-L42) reading the `ArrayBuffer` and sending a `Response` with the right content type.

## Try changing it!

You can set the `pictureURL` to any image URL you want and see how it works. If you use a PNG or GIF for the source picture, make sure you change the content type on response.

Play around with the various image API calls as well. Change watermark background colors, or mess with `gravity` on the `overlayWith` function call.