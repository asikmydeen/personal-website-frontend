const express = require('express');
const { protect } = require('../middleware/authMiddleware');
// Import the new activity handlers
const {
  handleGetActivities,
  handleGetActivityById,
  handleCreateActivity,
  handleUpdateActivity,
  handleDeleteActivity,
} = require('../handlers/activity/activityHandlers'); // Adjusted path

const router = express.Router();

// All routes are protected
router.use(protect); // Assuming all activity routes should be protected

// Define routes to use the new handlers
// These routes are now placeholders for how Express routes would call these handlers.
// In a serverless context, these specific Express route definitions might be superseded
// by API Gateway event mappings in serverless.yml, but they are good for local dev/testing.

router.get('/', (req, res) => {
  // This is a simplified Express-style call.
  // The actual invocation will be handleGetActivities(event, context) in Lambda.
  // For local testing, you might adapt this or use a wrapper.
  // For now, let's assume serverless.yml handles the direct Lambda invocation.
  res.status(501).json({ message: "Route to handleGetActivities - see serverless.yml for Lambda" });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: "Route to handleGetActivityById - see serverless.yml for Lambda" });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: "Route to handleCreateActivity - see serverless.yml for Lambda" });
});

router.put('/:id', (req, res) => {
  res.status(501).json({ message: "Route to handleUpdateActivity - see serverless.yml for Lambda" });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({ message: "Route to handleDeleteActivity - see serverless.yml for Lambda" });
});

// The actual handlers are designed for Lambda and will be mapped in serverless.yml.
// The Express router setup here is more for conceptual structure or local testing setups.
// For example, if you were to run this Express app directly (not as Lambda functions),
// you'd adapt the handlers or use wrappers.

// Exporting the handlers themselves for serverless.yml mapping
module.exports = {
  router, // For potential direct Express use or local testing
  // Exporting handlers for serverless.yml
  // Note: serverless.yml will point directly to handler files, e.g., backend/src/handlers/activity/activityHandlers.handleGetActivities
  // So, explicitly exporting them here for the router file's module.exports isn't strictly necessary for serverless.yml,
  // but it doesn't hurt and can be useful for other purposes.
  // However, the current structure of other route files (e.g. albumRoutes.js) just exports the router.
  // Let's stick to that pattern for consistency and modify serverless.yml accordingly.
};

// Reverting to the standard pattern of just exporting the router,
// as serverless.yml will reference the handler files directly.
// The comments above explain the thought process.

// Corrected structure for module.exports:
module.exports = router;
// And the route definitions should ideally call the controller methods
// if this were a pure Express app. However, since we're using Lambda handlers,
// the API Gateway will route to the handlers, which then call the controllers.
// The Express router is more for local development or if you have a hybrid setup.

// Let's redefine the routes to be more standard Express routes that would
// theoretically call controller functions directly, even though in Serverless
// the handlers are the entry points. This makes the Express routes more logical.
const activityController = require('../controllers/activityController');

router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// This setup is for a traditional Express app.
// For Serverless, API Gateway will map to the specific handlers in activityHandlers.js.
// The activityHandlers.js will then call these controller functions.
// This activityRoutes.js might be used for local Express server testing.