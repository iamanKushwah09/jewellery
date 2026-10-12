const mongoose = require('mongoose');

const salesmanCollectionSchema = new mongoose.Schema(
  {
    collectionId: {
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
    },
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesmanVisit',
      default: null,
    },
    collectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Received', 'Pending', 'Verified'],
      default: 'Received',
    },
    collectionDate: {
      type: Date,
      default: Date.now,
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
  mongoose.models.SalesmanCollection ||
  mongoose.model('SalesmanCollection', salesmanCollectionSchema);
