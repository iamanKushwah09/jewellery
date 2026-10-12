const Inventory = require("../models/inventory.model");
const Item = require("../models/item.model");
try { require("../models/category.model"); } catch (_) {}
try { require("../models/itemGroup.model"); } catch (_) {}

const INVENTORY_SOURCES = {
  1: { code: 1, key: "ITEM", name: "item" },
  2: { code: 2, key: "STOCK", name: "stock" },
  3: { code: 3, key: "SYNC", name: "sync" },
  4: { code: 4, key: "STOCK", name: "stock" },
  5: { code: 5, key: "SALE", name: "sale" },
};

/**
 * Determine lifecycle movement type strictly among: 'item', 'sale', 'stock'
 */
const inferMovementType = ({ prev, curr, diff, source_code, explicitType }) => {
  if (explicitType) {
    const lower = String(explicitType).toLowerCase();
    if (lower === "item" || lower === "initial") return "item";
    if (lower === "sale" || lower === "out" || lower === "order") return "sale";
    if (lower === "stock" || lower === "in" || lower === "adjustment") return "stock";
  }
  if (source_code === 1) return "item";
  if (source_code === 5 || diff < 0) return "sale";
  return "stock";
};

/**
 * Helper to record stock movement into Inventory collection.
 * Only records: item, sale, and stock. Sync events are ignored/disabled.
 */
const recordStockMovement = async ({
  item = null,
  itemId = null,
  previous_stock = 0,
  current_stock = 0,
  movement_type = null,
  reference_type = "",
  reference_id = "",
  channel = "WEB_ADMIN",
  unit = "PCS",
  source_code = 2,
  source_name = null,
  notes = "",
  updated_by = "Admin",
  updated_by_id = null,
  variants = [],
}) => {
  try {
    // 🛑 USER RULE: Ignore sync history for now
    const srcNameLower = String(source_name || "").toLowerCase();
    const refTypeLower = String(reference_type || "").toLowerCase();
    if (
      source_code === 3 ||
      srcNameLower.includes("sync") ||
      refTypeLower.includes("sync")
    ) {
      // Sync stock history disabled
      return null;
    }

    let targetItem = item;

    // If item object not passed, fetch it
    if (!targetItem && itemId) {
      targetItem = await Item.findById(itemId)
        .populate("category_id")
        .populate("item_group_id")
        .populate("unit_id")
        .lean();
    }

    if (!targetItem) {
      console.warn("⚠️ recordStockMovement: Item not found, cannot log stock");
      return null;
    }

    const prev = Number(previous_stock) || 0;
    const curr = Number(current_stock) || 0;
    const diff = curr - prev;

    let resolvedCode = Number(source_code) || 2;
    if (
      srcNameLower.includes("sale") ||
      srcNameLower.includes("sold") ||
      srcNameLower.includes("order")
    ) {
      resolvedCode = 5;
    } else if (srcNameLower.includes("create") || srcNameLower === "item" || resolvedCode === 1) {
      resolvedCode = 1;
    } else {
      resolvedCode = 2;
    }

    const derivedMovementType = inferMovementType({
      prev,
      curr,
      diff,
      source_code: resolvedCode,
      explicitType: movement_type,
    });

    const finalSourceName = derivedMovementType; // Canonical: 'item', 'sale', 'stock'

    const categoryName =
      targetItem.category_id?.name ||
      targetItem.category_name ||
      "";
    const itemGroupName =
      targetItem.item_group_id?.name ||
      targetItem.item_group_name ||
      "";
    const itemUnit =
      unit ||
      targetItem.unit_id?.name ||
      targetItem.unit ||
      "PCS";

    // For item creation, quantity_changed is the starting stock (or diff)
    const qtyChange = derivedMovementType === "item" && prev === 0 ? curr : diff;

    const logEntry = new Inventory({
      item_id: targetItem._id,
      item_name: targetItem.name,
      item_code: targetItem.item_code ? String(targetItem.item_code) : "",
      alias: targetItem.alias || "",
      category_id: targetItem.category_id?._id || targetItem.category_id || null,
      category_name: categoryName,
      item_group_id: targetItem.item_group_id?._id || targetItem.item_group_id || null,
      item_group_name: itemGroupName,
      previous_stock: prev,
      current_stock: curr,
      opening_stock: prev,
      closing_stock: curr,
      quantity_changed: qtyChange,
      movement_type: derivedMovementType,
      reference_type: reference_type || (derivedMovementType === "item" ? "ITEM_CREATION" : "MANUAL"),
      reference_id: reference_id ? String(reference_id) : "",
      channel: channel || "WEB_ADMIN",
      unit: itemUnit,
      source_code: resolvedCode,
      source_name: finalSourceName,
      notes: notes || `${finalSourceName}: ${qtyChange >= 0 ? `+${qtyChange}` : qtyChange}`,
      updated_by: updated_by || "Admin",
      updated_by_id: updated_by_id || null,
      variants: Array.isArray(variants) ? variants : [],
    });

    const savedLog = await logEntry.save();
    console.log(`📦 [Stock History] Saved: ${targetItem.name} | type: ${derivedMovementType} | Stock: ${Math.abs(qtyChange)} | Balance: ${curr}`);
    return savedLog;
  } catch (error) {
    console.error("❌ Error recording stock movement in inventory:", error);
    return null;
  }
};

/**
 * Bulk record stock movements for batch operations.
 * Automatically filters out sync records.
 */
const bulkRecordStockMovements = async (records) => {
  try {
    if (!Array.isArray(records) || records.length === 0) return [];

    // Filter out sync records
    const eligibleRecords = records.filter((rec) => {
      const srcName = String(rec.source_name || "").toLowerCase();
      const refType = String(rec.reference_type || "").toLowerCase();
      return (
        rec.source_code !== 3 &&
        !srcName.includes("sync") &&
        !refType.includes("sync")
      );
    });

    if (eligibleRecords.length === 0) return [];

    const documents = eligibleRecords.map((rec) => {
      const prev = Number(rec.previous_stock) || 0;
      const curr = Number(rec.current_stock) || 0;
      const diff = curr - prev;

      const derivedMovementType = inferMovementType({
        prev,
        curr,
        diff,
        source_code: rec.source_code,
        explicitType: rec.movement_type,
      });

      const qtyChange = derivedMovementType === "item" && prev === 0 ? curr : diff;

      return {
        item_id: rec.item_id || rec.item?._id,
        item_name: rec.item_name || rec.item?.name || "Unknown",
        item_code: rec.item_code ? String(rec.item_code) : rec.item?.item_code ? String(rec.item?.item_code) : "",
        alias: rec.alias || rec.item?.alias || "",
        category_id: rec.category_id || rec.item?.category_id?._id || null,
        category_name: rec.category_name || rec.item?.category_id?.name || "",
        item_group_id: rec.item_group_id || rec.item?.item_group_id?._id || null,
        item_group_name: rec.item_group_name || rec.item?.item_group_id?.name || "",
        previous_stock: prev,
        current_stock: curr,
        opening_stock: prev,
        closing_stock: curr,
        quantity_changed: qtyChange,
        movement_type: derivedMovementType,
        reference_type: rec.reference_type || (derivedMovementType === "item" ? "ITEM_CREATION" : "MANUAL"),
        reference_id: rec.reference_id ? String(rec.reference_id) : "",
        channel: rec.channel || "WEB_ADMIN",
        unit: rec.unit || rec.item?.unit || "PCS",
        source_code: derivedMovementType === "item" ? 1 : (derivedMovementType === "sale" ? 5 : 2),
        source_name: derivedMovementType,
        notes: rec.notes || `${derivedMovementType}: ${qtyChange >= 0 ? `+${qtyChange}` : qtyChange}`,
        updated_by: rec.updated_by || "Admin",
        updated_by_id: rec.updated_by_id || null,
        variants: rec.variants || [],
        createdAt: rec.createdAt || new Date(),
        updatedAt: rec.updatedAt || new Date(),
      };
    });

    const result = await Inventory.insertMany(documents, { ordered: false });
    console.log(`📦 [Stock History] Bulk saved ${result.length} records`);
    return result;
  } catch (error) {
    console.error("❌ Error in bulkRecordStockMovements:", error);
    return [];
  }
};

module.exports = {
  INVENTORY_SOURCES,
  recordStockMovement,
  bulkRecordStockMovements,
};
