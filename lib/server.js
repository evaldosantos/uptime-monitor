/**
 * Server related tasks
 */

// Dependency
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => server.unifiedServer(req, res));

// Instantiate the HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => server.unifiedServer(req, res));

// All the server logic for both the http and https server
server.unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // Choose the handler this request should bo to.
    // If one is not found, use the notFound handler
    const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // Use the status code called back by the handler, or default ot 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response', statusCode, payloadString);
    });
  });
}

// Define a request router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
}

// Init script
server.init = () => {
  // Start the server, and have it listen on config.httpPort
  server.httpServer.listen(config.httpPort, function() {
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} now`);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function() {
    console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} now`);
  });
}

// Export the module
module.exports = server;