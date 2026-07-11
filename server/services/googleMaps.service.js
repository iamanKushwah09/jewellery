const axios = require('axios');

const getDrivingDistance = async (origin, destination) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const R = 6371; // Radius of the earth in km
      const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
      const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; // Distance in km
    }

    // Google Routes API endpoint
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude
          }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE'
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
    };

    const response = await axios.post(url, requestBody, { headers });
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const distanceMeters = response.data.routes[0].distanceMeters;
      return distanceMeters / 1000; // Return in KM
    }
    
    throw new Error('No route found between origin and destination.');
  } catch (error) {
    console.error('Error fetching Google Maps distance:', error.response?.data || error.message);
    throw new Error('Failed to calculate distance. Please verify the addresses or try again later.');
  }
};

module.exports = {
  getDrivingDistance
};
