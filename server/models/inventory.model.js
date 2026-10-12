const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VariantMovementSchema = new Schema(
  {
    variant_id: { type: String },
    color: { type: String },
    size: { type: String },
    attributes: { type: Object },
    previous_stock: { type: Number, default: 0 },
    current_stock: { type: Number, default: 0 },
    quantity_changed: { type: Number, default: 0 },
  },
  { _id: false }
);

const InventorySchema = new Schema(
  {
    item_id: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    item_name: {
      type: String,
      required: true,
      index: true,
    },
    item_code: {
      type: String,
      index: true,
      default: "",
    },
    alias: {
      type: String,
      index: true,
      default: "",
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    category_name: {
      type: String,
      default: "",
    },
    item_group_id: {
      type: Schema.Types.ObjectId,
      ref: "ItemGroup",
      default: null,
    },
    item_group_name: {
      type: String,
      default: "",
    },
    previous_stock: {
      type: Number,
      required: true,
      default: 0,
    },
    current_stock: {
      type: Number,
      required: true,
      default: 0,
    },
    opening_stock: {
      type: Number,
      default: 0,
    },
    closing_stock: {
      type: Number,
      default: 0,
    },
    quantity_changed: {
      type: Number,
      required: true,
      default: 0,
    },
    movement_type: {
      type: String,
      enum: ["item", "sale", "stock", "INITIAL", "IN", "OUT", "ADJUSTMENT", "SYNC", "ORDER", "RETURN"],
      default: "stock",
      index: true,
    },
    reference_type: {
      type: String,
      default: "", // e.g. "MANUAL", "BUSY_SYNC", "SALE_ORDER", "INITIAL_SETUP"
    },
    reference_id: {
      type: String,
      default: "", // e.g. Order ID, Sync Batch ID, or Voucher No
    },
    channel: {
      type: String,
      default: "WEB_ADMIN", // "WEB_ADMIN", "BUSY_ERP", "SYSTEM", "MARKETPLACE"
    },
    unit: {
      type: String,
      default: "PCS",
    },
    source_code: {
      type: Number,
      required: true,
      index: true,
    },
    source_name: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    updated_by: {
      type: String,
      default: "Admin",
    },
    updated_by_id: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    variants: [VariantMovementSchema],
  },
  {
    timestamps: true,
    collection: "inventories",
  }
);

// Indexes for performant filtering, sorting, and lifetime ledger queries
InventorySchema.index({ createdAt: -1 });
InventorySchema.index({ item_id: 1, createdAt: 1 });
InventorySchema.index({ item_id: 1, createdAt: -1 });
InventorySchema.index({ item_code: 1, createdAt: 1 });
InventorySchema.index({ item_code: 1, createdAt: -1 });
InventorySchema.index({ source_code: 1, createdAt: -1 });
InventorySchema.index({ movement_type: 1, createdAt: -1 });

module.exports = mongoose.model("Inventory", InventorySchema);
