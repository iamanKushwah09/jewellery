const express = require('express');
const router = express.Router();
const {
  getLiveLocations,
  getLocationHistory,
  updateLocationRest,
  getTodaySummary,
} = require('../controller/salesmanTrackingController');
const { isAuth } = require('../config/auth');

router.get('/live-locations', isAuth, getLiveLocations);
router.get('/history/:salesmanId', isAuth, getLocationHistory);
router.get('/today-summary', isAuth, getTodaySummary);
router.post('/update-location', updateLocationRest);

module.exports = router;
