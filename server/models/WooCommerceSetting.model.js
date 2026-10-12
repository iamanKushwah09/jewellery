const mongoose = require("mongoose");

const wooCommerceSettingSchema = new mongoose.Schema(
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
    // WordPress / WooCommerce Store URL (e.g., https://example.com)
    storeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    // WooCommerce REST API Consumer Key (ck_...)
    consumerKey: {
      type: String,
      default: "",
      trim: true,
    },
    // WooCommerce REST API Consumer Secret (cs_...)
    consumerSecret: {
      type: String,
      default: "",
      trim: true,
    },
    // REST API Version (default wc/v3)
    apiVersion: {
      type: String,
      default: "wc/v3",
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
      default: "WOOCOMMERCE CUSTOMERS",
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

module.exports = mongoose.model("WooCommerceSetting", wooCommerceSettingSchema);
