// var express = require('express');
// var app = require('./app');

var http = require('http');
var VoltClient = require('./voltjs/client');
var VoltConfiguration = require('./voltjs/configuration');
var VoltConstants = require('./voltjs/voltconstants');
var util = require('util');
var VoltProcedure = require('./voltjs/query');
var AsyncPolling = require('async-polling');

var configs = [];
var client = new VoltClient(configs);

function voltinit() {
  configs.push(getConfiguration('localhost'));

  client.on(VoltConstants.SESSION_EVENT.CONNECTION,eventListener);
  client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR,eventListener);
  client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR,eventListener);
  client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR,eventListener);
  client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR,eventListener);

  client.connect(function startup(code, event,results) {
    util.log('Node connected to VoltDB');
    callProc(2);
  }, function loginError(code, event, results) {
    util.log('Node did not connect to VoltDB');
  });

}

function getConfiguration(host) {
  var cfg = new VoltConfiguration();
  cfg.host = host;
  cfg.messageQueueSize = 20;
  return cfg;
}

function eventListener(code, event, message) {
  util.log(util.format( 'Event %s\tcode: %d\tMessage: %s', event, code,
    message));
}

function callProc(num) {
  var selectProc = new VoltProcedure('tp', ['int']);
  var query = selectProc.getQuery();
  query.setParameters([num]);
  util.log('checkpoint...')

  client.callProcedure(query, function initVoter(code, event, results) {
    var val = results.table[0];
    util.log('Initialized app for ' + JSON.stringify(val).toString() + ' candidates.');
  });
}

voltinit();

AsyncPolling(function (end) {
  // Do whatever you want.
  callProc(1);
  // Then notify the polling node when your job is done:
  end();
  // This will schedule the next call.
}, 3000).run();

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(3000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:3000/");