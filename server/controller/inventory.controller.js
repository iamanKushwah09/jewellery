const mongoose = require("mongoose");
const Inventory = require("../models/inventory.model");
const Item = require("../models/item.model");
const { INVENTORY_SOURCES } = require("../services/inventory.service");

// Get all inventory logs with filtering, searching, and pagination
exports.getAllInventoryLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      source_code,
      movement_type,
      item_id,
      item_code,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Filter by item_id if provided
    if (item_id) {
      if (mongoose.Types.ObjectId.isValid(item_id)) {
        query.item_id = item_id;
      }
    }

    // Filter by item_code if provided
    if (item_code) {
      query.item_code = String(item_code).trim();
    }

    // Filter by source_code if provided
    if (source_code !== undefined && source_code !== "" && source_code !== "all") {
      query.source_code = Number(source_code);
    }

    // Filter by movement_type if provided
    if (movement_type && movement_type !== "ALL" && movement_type !== "") {
      query.movement_type = movement_type.toUpperCase();
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Filter by search text (item_name, item_code, alias, reference_id)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { item_name: searchRegex },
        { item_code: searchRegex },
        { alias: searchRegex },
        { reference_id: searchRegex },
      ];
    }

    // User instruction: exclude sync logs, only keep item, sale, and stock
    if (source_code === undefined || source_code === "" || source_code === "all") {
      query.source_code = { $ne: 3 };
      query.source_name = { $not: /sync/i };
    }

    const currentPage = Math.max(1, Number(page));
    const perPage = Math.min(100, Math.max(1, Number(limit)));
    const skip = (currentPage - 1) * perPage;

    const [logs, totalDoc] = await Promise.all([
      Inventory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Inventory.countDocuments(query),
    ]);

    // Ensure backwards compatibility and normalize to item, sale, stock
    const enrichedLogs = logs.map((log) => {
      const diff =
        log.quantity_changed !== undefined
          ? log.quantity_changed
          : (log.current_stock || 0) - (log.previous_stock || 0);

      const opening =
        log.opening_stock !== undefined
          ? log.opening_stock
          : (log.previous_stock !== undefined ? log.previous_stock : 0);

      const closing =
        log.closing_stock !== undefined
          ? log.closing_stock
          : (log.current_stock !== undefined ? log.current_stock : 0);

      const srcName = String(log.source_name || "").toLowerCase();
      const mType = String(log.movement_type || "").toLowerCase();

      let cleanType = "stock";
      if (
        log.source_code === 5 ||
        mType === "out" ||
        mType === "sale" ||
        srcName.includes("sale") ||
        srcName.includes("sold") ||
        srcName.includes("order")
      ) {
        cleanType = "sale";
      } else if (
        log.source_code === 1 ||
        mType === "initial" ||
        mType === "item" ||
        srcName === "item" ||
        srcName.includes("create")
      ) {
        cleanType = "item";
      } else {
        cleanType = "stock";
      }

      let rowStock = Math.abs(diff);
      if (cleanType === "item" && opening === 0 && closing > 0) {
        rowStock = closing;
      }

      return {
        ...log,
        type: cleanType,
        stock: rowStock,
        balance: closing,
        opening_stock: opening,
        closing_stock: closing,
        quantity_changed: diff,
        movement_type: cleanType,
        source_name: cleanType,
      };
    });

    const totalPages = Math.ceil(totalDoc / perPage) || 1;

    return res.status(200).json({
      status: "success",
      logs: enrichedLogs,
      totalDoc,
      pages: totalPages,
      limits: perPage,
      page: currentPage,
    });
  } catch (error) {
    console.error("❌ Error fetching inventory logs:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching inventory logs",
      error: error.message,
    });
  }
};

// Get complete lifetime stock history & ledger for a specific item (item, sale, stock only)
exports.getItemInventoryHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { movement_type, order = "asc" } = req.query;

    if (!itemId) {
      return res.status(400).json({
        status: "error",
        message: "Item ID is required",
      });
    }

    // Try finding the item by ObjectId or item_code
    let targetItem = null;
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      targetItem = await Item.findById(itemId)
        .populate("category_id", "name")
        .populate("item_group_id", "name")
        .populate("unit_id", "name")
        .lean();
    }

    if (!targetItem) {
      targetItem = await Item.findOne({ item_code: itemId })
        .populate("category_id", "name")
        .populate("item_group_id", "name")
        .populate("unit_id", "name")
        .lean();
    }

    const itemFilter = targetItem
      ? { $or: [{ item_id: targetItem._id }, { item_code: String(targetItem.item_code) }] }
      : mongoose.Types.ObjectId.isValid(itemId)
      ? { item_id: itemId }
      : { item_code: String(itemId) };

    // Fetch historical records
    const rawRecords = await Inventory.find(itemFilter)
      .sort({ createdAt: 1 })
      .lean();

    // 🛑 USER RULE: Ignore sync records, keep only item, sale, and stock
    const cleanRecords = rawRecords.filter((rec) => {
      const src = String(rec.source_name || "").toLowerCase();
      const mType = String(rec.movement_type || "").toLowerCase();
      const ref = String(rec.reference_type || "").toLowerCase();
      if (
        rec.source_code === 3 ||
        src.includes("sync") ||
        mType.includes("sync") ||
        ref.includes("sync")
      ) {
        return false;
      }
      return true;
    });

    let lifetimeIn = 0;
    let lifetimeOut = 0;
    let initialStock = 0;
    let initialSet = false;
    const breakdown = {
      item: 0,
      sale: 0,
      stock: 0,
    };

    // Calculate ledger with exact columns: Date, type, stock, Balance
    const ledger = cleanRecords.map((record) => {
      const prev = record.opening_stock !== undefined ? record.opening_stock : (record.previous_stock || 0);
      const curr = record.closing_stock !== undefined ? record.closing_stock : (record.current_stock || 0);
      const diff = record.quantity_changed !== undefined ? record.quantity_changed : (curr - prev);

      const srcName = String(record.source_name || "").toLowerCase();
      const mType = String(record.movement_type || "").toLowerCase();

      let cleanType = "stock";
      if (
        record.source_code === 5 ||
        mType === "out" ||
        mType === "sale" ||
        srcName.includes("sale") ||
        srcName.includes("sold") ||
        srcName.includes("order") ||
        diff < 0
      ) {
        cleanType = "sale";
      } else if (
        record.source_code === 1 ||
        mType === "initial" ||
        mType === "item" ||
        srcName === "item" ||
        srcName.includes("create")
      ) {
        cleanType = "item";
      } else {
        cleanType = "stock";
      }

      // Quantity of this transaction
      let rowStock = Math.abs(diff);
      if (cleanType === "item" && prev === 0 && curr > 0) {
        rowStock = curr;
      }

      const balance = curr;

      if (!initialSet && cleanType === "item") {
        initialStock = rowStock;
        initialSet = true;
      }

      if (cleanType === "sale") {
        lifetimeOut += rowStock;
      } else if (cleanType === "stock" && diff > 0) {
        lifetimeIn += rowStock;
      }

      if (breakdown[cleanType] !== undefined) {
        breakdown[cleanType] += 1;
      }

      return {
        ...record,
        type: cleanType,
        stock: rowStock,
        balance: balance,
        opening_stock: prev,
        closing_stock: curr,
        quantity_changed: diff,
        movement_type: cleanType,
        source_name: cleanType,
      };
    });

    const currentLiveStock = targetItem ? (targetItem.stock || 0) : (ledger[ledger.length - 1]?.balance ?? 0);
    const netChange = lifetimeIn - lifetimeOut;

    // Filter by type if requested
    let filteredRecords = ledger;
    if (movement_type && movement_type !== "ALL" && movement_type !== "") {
      const targetType = movement_type.toLowerCase();
      filteredRecords = ledger.filter((r) => r.type === targetType);
    }

    // Default to chronological (oldest first, like spreadsheet) or descending if order === "desc"
    const displayRecords = order === "desc" ? [...filteredRecords].reverse() : filteredRecords;

    return res.status(200).json({
      status: "success",
      item: targetItem
        ? {
            _id: targetItem._id,
            name: targetItem.name,
            item_code: targetItem.item_code,
            alias: targetItem.alias,
            image: targetItem.image,
            stock: targetItem.stock || 0,
            unit: targetItem.unit_id?.name || targetItem.unit || "PCS",
            category_name: targetItem.category_id?.name || targetItem.category_name || "",
            item_group_name: targetItem.item_group_id?.name || targetItem.item_group_name || "",
          }
        : null,
      lifetime_summary: {
        initial_stock: initialStock,
        current_stock: currentLiveStock,
        lifetime_in: lifetimeIn,
        lifetime_out: lifetimeOut,
        net_change: netChange,
        total_events: cleanRecords.length,
        first_movement_at: cleanRecords[0]?.createdAt || null,
        last_movement_at: cleanRecords[cleanRecords.length - 1]?.createdAt || null,
        breakdown,
      },
      data: displayRecords,
      total: cleanRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching item inventory history:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching item history",
      error: error.message,
    });
  }
};

// Get all defined inventory sources metadata (item, stock, sale only)
exports.getInventorySources = (req, res) => {
  const sources = [
    { code: 1, key: "ITEM", name: "item" },
    { code: 2, key: "STOCK", name: "stock" },
    { code: 5, key: "SALE", name: "sale" },
  ];
  return res.status(200).json({
    status: "success",
    sources,
  });
};

