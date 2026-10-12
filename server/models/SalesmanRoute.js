const mongoose = require('mongoose');

const salesmanRouteSchema = new mongoose.Schema(
  {
    routeId: {
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
    routeDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    partyName: {
      type: String,
      default: '',
    },
    parties: [
      {
        party: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Customer',
        },
        partyName: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['Pending', 'Completed'],
          default: 'Pending',
        },
        collectionAmount: {
          type: Number,
          default: 0,
        },
        visitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SalesmanVisit',
        },
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    collectionAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
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
  mongoose.models.SalesmanRoute ||
  mongoose.model('SalesmanRoute', salesmanRouteSchema);
