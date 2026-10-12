const mongoose = require("mongoose");

const flipkartSettingSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ["production", "sandbox", "simulation"],
      default: "simulation",
    },
    appId: {
      type: String,
      default: "",
    },
    appSecret: {
      type: String,
      default: "",
    },
    sellerId: {
      type: String,
      default: "",
    },
    locationId: {
      type: String,
      default: "",
    },
    webhookSecret: {
      type: String,
      default: "",
    },
    accessToken: {
      type: String,
      default: "",
    },
    tokenExpiry: {
      type: Date,
      default: null,
    },
    autoSyncOrders: {
      type: Boolean,
      default: true,
    },
    autoSyncStock: {
      type: Boolean,
      default: true,
    },
    syncIntervalMinutes: {
      type: Number,
      default: 15, // 5, 10, 15, 30, 60 minutes
    },
    lastOrderSyncAt: {
      type: Date,
      default: null,
    },
    lastStockSyncAt: {
      type: Date,
      default: null,
    },
    lastSyncStatus: {
      type: String,
      enum: ["IDLE", "SUCCESS", "FAILED", "RUNNING"],
      default: "IDLE",
    },
    lastErrorMessage: {
      type: String,
      default: "",
    },
    totalOrdersSynced: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const FlipkartSetting = mongoose.model("FlipkartSetting", flipkartSettingSchema);
module.exports = FlipkartSetting;
