const mongoose = require("mongoose");

const amazonSyncLogSchema = new mongoose.Schema(
  {
    syncType: {
      type: String,
      enum: ["ORDER_INGEST", "INVENTORY_PUSH", "WEBHOOK", "MANUAL_PULL", "SIMULATION", "CONNECTION_TEST"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PARTIAL", "IN_PROGRESS"],
      required: true,
    },
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    itemsUpdated: {
      type: Number,
      default: 0,
    },
    ordersCreated: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      default: "",
    },
    triggeredBy: {
      type: String,
      enum: ["cron", "webhook", "admin", "system"],
      default: "system",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const AmazonSyncLog = mongoose.model("AmazonSyncLog", amazonSyncLogSchema);
module.exports = AmazonSyncLog;
