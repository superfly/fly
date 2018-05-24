// NOTES:
// All requests using a hostname are routed to 127.0.0.1
// Port 3004 has a live server, see below for paths and responses
// Port 3002 has no server, connections will be refused
// Port 3443 has a live https server


const Express     = require('express');
const bodyParser  = require('body-parser');
const compression = require('compression');
const HTTP        = require('http');
const HTTPS       = require('https');
const Replay      = require('../src');
const File        = require('fs');
const Async       = require('async');


const HTTP_PORT     = 3004;
const HTTPS_PORT    = 3443;
const INACTIVE_PORT = 3002;
const CORRUPT_PORT  = 3555;
const SSL = {
  key:  File.readFileSync(`${__dirname}/ssl/privatekey.pem`),
  cert: File.readFileSync(`${__dirname}/ssl/certificate.pem`)
};


// Directory to load fixtures from.
Replay.fixtures = `${__dirname}/fixtures`;

Replay.silent = true;


// Serve pages from localhost.
const server = new Express();
server.use(compression({
  filter: function(req) {
    return req.headers['accept-encoding'] != null;
  },
  threshold: 1
}));
server.use( bodyParser.urlencoded({ extended: false }) );

// Success page.
server.get('/', function(req, res) {
  res.send('Success!');
});
// Not found
server.get('/404', function(req, res) {
  res.status(404).send('Not found');
});
// Internal error
server.get('/500', function(req, res) {
  res.status(500).send('Boom!');
});
// Query string
server.get('/query', function(req, res) {
  res.send({
    name: req.query.name,
    extra: req.query.extra
  });
});
// Multiple set-cookie headers
server.get('/set-cookie', function(req, res) {
  res.cookie('c1', 'v1');
  res.cookie('c2', 'v2');
  res.sendStatus(200);
});
// POST data
server.post('/post-data', function(req, res) {
  res.sendStatus(200);
});
// Echo POST body
server.post('/post-echo', function(req, res) {
  res.send(req.body);
});


// Setup environment for running tests.
let running = false;
function setup(callback) {
  if (running)
    process.nextTick(callback);
  else
    Async.parallel([
      function(done) {
        HTTP.createServer(server).listen(HTTP_PORT, done);
      },
      function(done) {
        HTTPS.createServer(SSL, server).listen(HTTPS_PORT, done);
      }
    ], function(error) {
      running = true;
      callback(error);
    });
}


module.exports = { setup, HTTP_PORT, HTTPS_PORT, INACTIVE_PORT, CORRUPT_PORT };

