const mongoose = require("mongoose");

const shopifySettingSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ["production", "simulation"],
      default: "simulation",
    },
    // Shopify Store Domain (e.g., your-store.myshopify.com)
    shopDomain: {
      type: String,
      default: "",
      trim: true,
    },
    // Shopify Admin API Access Token (shpat_...)
    accessToken: {
      type: String,
      default: "",
      trim: true,
    },
    // Shopify API Version
    apiVersion: {
      type: String,
      default: "2024-04",
      trim: true,
    },
    // Optional Webhook Verification Secret
    webhookSecret: {
      type: String,
      default: "",
      trim: true,
    },
    // Optional API Key & Secret for custom private apps
    apiKey: {
      type: String,
      default: "",
      trim: true,
    },
    apiSecretKey: {
      type: String,
      default: "",
      trim: true,
    },
    // Sync Configurations
    autoSyncOrders: {
      type: Boolean,
      default: true,
    },
    syncIntervalMinutes: {
      type: Number,
      default: 15,
    },
    // Busy ERP Accounting Mapping
    busySeries: {
      type: String,
      default: "MAIN",
      trim: true,
    },
    busySaleType: {
      type: String,
      default: "L/GST 18%",
      trim: true,
    },
    busyPartyName: {
      type: String,
      default: "SHOPIFY CUSTOMERS",
      trim: true,
    },
    busyMatCenter: {
      type: String,
      default: "Main Store",
      trim: true,
    },
    busyVchType: {
      type: Number,
      default: 9, // Sales Order
    },
    // Sync Metrics & State
    lastOrderSyncAt: {
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

module.exports = mongoose.model("ShopifySetting", shopifySettingSchema);
