const mongoose = require('mongoose');

const salesmanLocationHistorySchema = new mongoose.Schema(
  {
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salesman',
      required: true,
      index: true,
    },
    trackingSessionId: {
      type: String,
      default: '',
      index: true,
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

salesmanLocationHistorySchema.index({ salesmanId: 1, timestamp: -1 });
salesmanLocationHistorySchema.index({ location: '2dsphere' });

module.exports =
  mongoose.models.SalesmanLocationHistory ||
  mongoose.model('SalesmanLocationHistory', salesmanLocationHistorySchema);
