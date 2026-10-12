const mongoose = require('mongoose');

const salesmanVisitSchema = new mongoose.Schema(
  {
    visitId: {
      type: Number,
      unique: true,
      index: true,
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salesman',
      required: true,
      index: true,
    },
    salesmanName: {
      type: String,
      default: '',
    },
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    partyName: {
      type: String,
      default: '',
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesmanRoute',
      default: null,
      index: true,
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    location: {
      address: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    photo: {
      type: String,
      default: '',
    },
    inPhoto: {
      type: String,
      default: '',
    },
    inLocation: {
      address: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      timestamp: { type: Date, default: null },
    },
    outPhoto: {
      type: String,
      default: '',
    },
    outLocation: {
      address: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      timestamp: { type: Date, default: null },
    },
    additionalPhotos: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        address: { type: String, default: '' },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    collectionAmount: {
      type: Number,
      default: 0,
    },
    collectionNotes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.SalesmanVisit ||
  mongoose.model('SalesmanVisit', salesmanVisitSchema);
