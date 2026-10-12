const Country = require("../models/Country");
const State = require("../models/State");
const City = require("../models/City");

// Get individual country record by ID
exports.getCountry = async (req, res) => {
    try {
        const country = await Country.find();
        if (!country) {
            return res.status(404).json({ message: "Country not found" });
        }
        res.json(country);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get individual state record by ID
exports.getStateById = async (req, res) => {
    try {
        const state = await State.find({country_id:req.params.id});
        
        if (!state) {
            return res.status(404).json({ message: "State not found" });
        }
        res.json(state);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get individual city record by ID
exports.getCityByCountryAndStateId = async (req, res) => {
    try {
        const { country_id, state_id } = req.params; // Destructure params
        const city = await City.find({ country_id, state_id }); // Query using both fields
        if (!city) {
            return res.status(404).json({ message: "City not found" });
        }
        res.json(city);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================================================
// Helper: Resolve address from coordinates with resilient multi-tier fallback
// Tier 1: Google Maps Geocoding API (Official, if key and billing active)
// Tier 2: BigDataCloud Reverse Geocoding API (Fast, free, reliable in India)
// Tier 3: OpenStreetMap Nominatim API (Detailed street-level)
// Tier 4: Formatted GPS string
// ====================================================================
async function resolveAddressFromCoordinates(latitude, longitude) {
    const axios = require('axios');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // 1. PRIMARY: Try Google Maps Geocoding API
    if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
            const response = await axios.get(url, { timeout: 4500 });
            const data = response.data;

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                return {
                    success: true,
                    address: data.results[0].formatted_address,
                    placeId: data.results[0].place_id,
                    components: data.results[0].address_components,
                    provider: 'google',
                };
            } else if (data.status === 'ZERO_RESULTS') {
                // fall through to BDC/OSM
            } else {
                console.warn(`[Location] Google Geocoding returned ${data.status}: ${data.error_message || ''}. Using resilient fallback.`);
            }
        } catch (gErr) {
            console.warn('[Location] Google Geocoding request failed:', gErr.message, '. Using resilient fallback.');
        }
    }

    // 2. FALLBACK TIER 2: BigDataCloud Reverse Geocode (free, high availability)
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        const bdcRes = await axios.get(bdcUrl, { timeout: 3500 });
        if (bdcRes.data) {
            const d = bdcRes.data;
            const parts = [
                d.locality,
                d.city || d.localityInfo?.administrative?.[2]?.name,
                d.principalSubdivision,
                d.countryName,
            ].filter(Boolean);

            if (parts.length > 0) {
                const uniqueParts = [...new Set(parts)];
                return {
                    success: true,
                    address: uniqueParts.join(', '),
                    placeId: null,
                    components: [],
                    provider: 'bigdatacloud',
                };
            }
        }
    } catch (bdcErr) {
        // fall through to Nominatim
    }

    // 3. FALLBACK TIER 3: OpenStreetMap Nominatim
    try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const osmRes = await axios.get(osmUrl, {
            timeout: 3500,
            headers: { 'User-Agent': 'FlipkartSyncAdmin/1.0' },
        });
        if (osmRes.data && osmRes.data.display_name) {
            return {
                success: true,
                address: osmRes.data.display_name,
                placeId: osmRes.data.osm_id?.toString() || null,
                components: [],
                provider: 'osm',
            };
        }
    } catch (osmErr) {
        // fall through
    }

    // 4. ULTIMATE FALLBACK: Clean Coordinates
    return {
        success: true,
        address: `📍 Lat: ${Number(latitude).toFixed(5)}, Lng: ${Number(longitude).toFixed(5)}`,
        placeId: null,
        components: [],
        provider: 'coordinates',
    };
}

// ====================================================================
// Reverse Geocode (API Route)
// Used by: Salesman Check-In/Check-Out, Tracking, Visits
// ====================================================================
exports.reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'lat and lng query parameters are required',
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'lat and lng must be valid numbers',
            });
        }

        const result = await resolveAddressFromCoordinates(latitude, longitude);
        return res.json(result);
    } catch (error) {
        console.error('Reverse geocode error:', error.message);
        // Even on unexpected error, return formatted coordinate fallback so client never breaks
        const latNum = parseFloat(req.query.lat);
        const lngNum = parseFloat(req.query.lng);
        return res.json({
            success: true,
            address: !isNaN(latNum) && !isNaN(lngNum)
                ? `📍 Lat: ${latNum.toFixed(5)}, Lng: ${lngNum.toFixed(5)}`
                : 'GPS Location Locked',
            provider: 'coordinates',
        });
    }
};

// ====================================================================
// Forward Geocode: Search coordinates from text address
// ====================================================================
exports.forwardGeocode = async (req, res) => {
    try {
        const { address } = req.query;
        if (!address || !address.trim()) {
            return res.status(400).json({ success: false, message: 'Address query is required' });
        }

        const query = address.trim();
        const axios = require('axios');
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        // 1. Try Google Maps
        if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&language=en`;
                const response = await axios.get(url, { timeout: 4500 });
                const data = response.data;

                if (data.status === 'OK' && data.results && data.results.length > 0) {
                    const loc = data.results[0].geometry.location;
                    return res.json({
                        success: true,
                        lat: loc.lat,
                        lng: loc.lng,
                        formatted_address: data.results[0].formatted_address,
                        provider: 'google',
                    });
                }
            } catch (gErr) {
                console.warn('[Location] Google forward geocode error:', gErr.message, '. Using Nominatim fallback.');
            }
        }

        // 2. Fallback: OpenStreetMap Nominatim Search
        try {
            const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const osmRes = await axios.get(osmUrl, {
                timeout: 4000,
                headers: { 'User-Agent': 'FlipkartSyncAdmin/1.0' },
            });
            if (osmRes.data && Array.isArray(osmRes.data) && osmRes.data.length > 0) {
                const first = osmRes.data[0];
                return res.json({
                    success: true,
                    lat: parseFloat(first.lat),
                    lng: parseFloat(first.lon),
                    formatted_address: first.display_name || query,
                    provider: 'osm',
                });
            }
        } catch (osmErr) {
            console.warn('[Location] OSM search error:', osmErr.message);
        }

        return res.status(404).json({ success: false, message: 'Address not found on maps' });
    } catch (error) {
        console.error('Forward geocode error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to locate address' });
    }
};

exports.resolveAddressFromCoordinates = resolveAddressFromCoordinates;
