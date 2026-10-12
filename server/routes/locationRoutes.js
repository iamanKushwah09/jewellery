const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");
// Route to get all countries
router.get("/countries", locationController.getCountry);
// Route to get a state by ID
router.get("/states/:id", locationController.getStateById);
// Route to get a city by country ID and state ID
router.get("/cities/:country_id/:state_id", locationController.getCityByCountryAndStateId);
// Route to reverse geocode lat/lng → address using Google Maps API
router.get("/reverse-geocode", locationController.reverseGeocode);
// Route to forward geocode address → lat/lng using Google Maps API
router.get("/forward-geocode", locationController.forwardGeocode);
module.exports = router;



