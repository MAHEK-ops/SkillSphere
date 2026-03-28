const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');
const EventController = require('../controllers/EventController');
const BookmarkController = require('../controllers/BookmarkController');
const validate = require('../middleware/validate');
const timelineSchema = require('../validation/timelineSchema');

// ─── Health Check ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// ─── Timeline Endpoints ────────────────────────────────────────
router.post('/timeline', validate(timelineSchema), (req, res) => LocationController.getTimeline(req, res));
router.get('/timeline/:locationId/story', (req, res) => LocationController.getStory(req, res));

// ─── Event Endpoints ────────────────────────────────────────────
router.get('/events/viewport', (req, res) => EventController.getEventsByViewport(req, res));
router.get('/events', (req, res) => EventController.getEvents(req, res));

// ─── Compare Endpoint ──────────────────────────────────────────
router.get('/compare', (req, res) => EventController.compareLocations(req, res));

// ─── Trends Endpoint ───────────────────────────────────────────
router.get('/trends/:locationId', (req, res) => EventController.getTrends(req, res));

// ─── Bookmark Endpoints ────────────────────────────────────────
router.post('/bookmarks', (req, res) => BookmarkController.save(req, res));
router.get('/bookmarks/:userId', (req, res) => BookmarkController.getByUserId(req, res));
router.delete('/bookmarks/:id', (req, res) => BookmarkController.delete(req, res));

module.exports = router;

