const mongoose = require("mongoose");

const amazonSettingSchema = new mongoose.Schema(
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
    // LWA OAuth2 Credentials
    lwaClientId: {
      type: String,
      default: "",
    },
    lwaClientSecret: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    // Seller Details
    sellerId: {
      type: String,
      default: "",
    },
    marketplaceId: {
      type: String,
      default: "A21TJRUUN4KGV", // Amazon India
    },
    // Cached LWA Access Token
    accessToken: {
      type: String,
      default: "",
    },
    tokenExpiry: {
      type: Date,
      default: null,
    },
    // Sync Configuration
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
    // Sync Status
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

const AmazonSetting = mongoose.model("AmazonSetting", amazonSettingSchema);
module.exports = AmazonSetting;
