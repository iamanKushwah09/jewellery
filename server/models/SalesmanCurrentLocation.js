const mongoose = require('mongoose');

const salesmanCurrentLocationSchema = new mongoose.Schema(
  {
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salesman',
      required: true,
      unique: true,
      index: true,
    },
    salesmanName: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    battery: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: '',
    },
    trackingStatus: {
      type: String,
      enum: ['live', 'stale', 'offline'],
      default: 'live',
    },
    trackingSessionId: {
      type: String,
      default: '',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON 2dsphere index for geospatial queries
salesmanCurrentLocationSchema.index({ location: '2dsphere' });

module.exports =
  mongoose.models.SalesmanCurrentLocation ||
  mongoose.model('SalesmanCurrentLocation', salesmanCurrentLocationSchema);
