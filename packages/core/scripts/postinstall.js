const FLYRS_RELEASE = "v0.0.1-alpha.6"
const os = require('os');

if (os.arch() !== "x64")
  return console.warn("WARN: os archs other than x64 are not supported for fly-dns")

const platform = os.platform();
if (platform === "win32")
  return console.warn("WARN: windows is not yet support for fly-dns")

let url;
if (platform === "darwin")
  url = `https://github.com/superfly/fly.rs/releases/download/${FLYRS_RELEASE}/fly-osx-x64.tar.gz`
else
  url = `https://github.com/superfly/fly.rs/releases/download/${FLYRS_RELEASE}/fly-linux-x64.tar.gz`

const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');
const gzip = zlib.createGunzip();

const tar = require('tar-stream'); // got that from tar-fs

try {
  fs.mkdirSync("bin")
} catch(e) {} // this can fail silently
axios.get(url, {responseType:'stream'}).then(function(response) {
  const extract = tar.extract();

  extract.on('entry', (header, stream, next)=>{
    stream.on('end', function() {
      next() // ready for next entry
    })

    if (header.name === 'dns') {
      const file = fs.createWriteStream("bin/fly-dns", {mode: header.mode});
      stream.pipe(file)
    } else
      stream.resume() // just auto drain the stream
  })

  response.data.pipe(gzip).pipe(extract);
});