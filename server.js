// Import dependencies
const jsonServer = require('json-server');
const fs = require('fs');

// Create the server
const server = jsonServer.create();

// Load routes from routes.json
const routes = JSON.parse(fs.readFileSync('./routes.json', 'utf-8'));

// Load database
const router = jsonServer.router('./db.json');
const middlewares = jsonServer.defaults();

// Set the port
const port = 3001;

// Use default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Rewriter to map API requests to the right endpoints
server.use(jsonServer.rewriter(routes));

// Use the router
server.use(router);

// Start server
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
  console.log(`Routes have been mapped according to routes.json`);
  console.log(`API is available at http://localhost:${port}`);
});
