var fs = require('fs');
var vows = require('vows');
var assert = require('assert');
var winston = require('winston');
var dgram = require('dgram');
var parser = require('glossy').Parse;
var Syslog = require('../lib/winston-syslog').Syslog;

var PORT = 11229;
var server;
var transport;

vows.describe('syslog messages').addBatch({
  'opening fake syslog server': {
    topic: function () {
      var self = this;
      server = dgram.createSocket('udp4');
      server.on('listening', function () {
        self.callback();
      });

      server.bind(PORT);
    },
    'default format': {
      topic: function () {
        var self = this;
        server.once('message', function (msg) {
          parser.parse(msg, function (d) {
            self.callback(undefined, d);
          });
        });

        transport = new winston.transports.Syslog({
          port: PORT
        });

        transport.log('debug', 'ping', null, function (err) {
          assert.ifError(err);
        });
      },
      'should have host field set to localhost': function (msg) {
        assert.equal(msg.host, 'localhost');
        transport.close();
      },
      'setting locahost option to a different falsy value (null)': {
        topic: function () {
          var self = this;
          server.once('message', function (msg) {
            parser.parse(msg, function (d) {
              self.callback(undefined, d);
            });
          });

          transport = new winston.transports.Syslog({
            port: PORT,
            localhost: null
          });

          transport.log('debug', 'ping2', null, function (err) {
            assert.ifError(err);
          });
        },
        'should have host different from localhost': function (msg) {
          assert.notEqual(msg.host, 'localhost');
          transport.close();
        },
        'setting appName option to hello': {
          topic: function () {
            var self = this;
            server.once('message', function (msg) {
              parser.parse(msg, function (d) {
                self.callback(undefined, d);
              });
            });

            transport = new winston.transports.Syslog({
              port: PORT,
              type: '5424',
              appName: 'hello'
            });

            transport.log('debug', 'app name test', null, function (err) {
              assert.ifError(err);
            });
          },
          'should have appName field set to hello': function (msg) {
            assert.equal(msg.appName, 'hello');
            transport.close();
          },
          'setting app_name option to hello': {
            topic: function () {
              var self = this;
              server.once('message', function (msg) {
                parser.parse(msg, function (d) {
                  self.callback(undefined, d);
                });
              });

              transport = new winston.transports.Syslog({
                port: PORT,
                type: '5424',
                app_name: 'hello'
              });

              transport.log('debug', 'app name test', null, function (err) {
                assert.ifError(err);
              });
            },
            'should have appName field set to hello': function (msg) {
              assert.equal(msg.appName, 'hello');
              transport.close();
            }
          }
        }
      }
    },
    teardown: function () {
      server.close();
    }
  }
}).export(module);
