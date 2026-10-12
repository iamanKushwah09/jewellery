const Item = require("../models/item.model");
const fileUploadHelper = require("../fileUploader/fileUploadHelper");
const { pathToBase64 } = require("../common/folderToBase64");
const itemGroupModel = require("../models/itemGroup.model");
const axios = require("axios");
const CategoryModel = require("../models/category.model");
const UnitModel = require("../models/Unit");
const Attribute = require("../models/Attribute");
const mongoose = require("mongoose");
const path = require("path");
const { logImageChange } = require("../utils/imageLogger");

// GMC Auto-Sync Queue — non-blocking async queue
const { enqueueGmcJob } = require("../services/gmc/gmcQueue");
const {
  recordStockMovement,
  bulkRecordStockMovements,
  INVENTORY_SOURCES,
} = require("../services/inventory.service");

// Helper: sanitize empty string ObjectId fields to avoid CastError
function sanitizeItemObjectIds(body) {
  if (!body || typeof body !== "object") return;
  const idFields = ["category_id", "item_group_id", "brand_id", "unit_id"];
  for (const field of idFields) {
    if (
      body[field] === "" ||
      body[field] === "undefined" ||
      body[field] === "null" ||
      !body[field]
    ) {
      delete body[field];
    } else if (
      typeof body[field] === "string" &&
      !mongoose.Types.ObjectId.isValid(body[field])
    ) {
      delete body[field];
    }
  }
}

// Helper: resolve upload folder path correctly regardless of relative/absolute FILE_UPLOAD_FOLDER
function getUploadBasePath() {
  const folder = process.env.FILE_UPLOAD_FOLDER || "uploadFile";
  return path.resolve(process.cwd(), folder);
}

// Create a new item
exports.createItem = async (req, res) => {
  try {
    sanitizeItemObjectIds(req.body);
    const images = req.body.image;
    if (!Array.isArray(images)) {
      return res
        .status(400)
        .json({ message: "Invalid input: `image` should be an array." });
    }

    if (typeof req.body.showOnWebsite === "undefined") {
      req.body.showOnWebsite = true;
    }

    const uploadFolder = `items/${(req.body?.item_code || 'new_item')}/${(req.body?.name || 'general').replace(/\+/g, "_").replace(/[^\w\-]/g, "")}`;

    if (Array.isArray(images)) {
      const uploadedPaths = await Promise.all(
        images.map(async (image) => {
          if (image.base64File && image.fileName) {
            const { base64File, fileName } = image;
            const cleanedBase64File = base64File.split(";base64,").pop();
            return await fileUploadHelper.uploadSingleFile(
              uploadFolder,
              fileName.replace(/\s+/g, ""),
              cleanedBase64File,
            );
          }
          const relativePath = image.url
            ? image.url.replace(process.env.BASE_URL, "")
            : typeof image === "string"
              ? image
              : "";
          return relativePath;
        }),
      );
      req.body.image = uploadedPaths.filter((p) => p !== "");
      if (req.body.image.length === 0) {
        req.body.image = ["/default/default_image.png"];
      }
    }

    if (Array.isArray(req.body?.item_attribute?.variant)) {
      await Promise.all(
        req.body.item_attribute.variant.map(async (variant) => {
          if (
            Array.isArray(variant.attribute_image) &&
            variant.attribute_image.length > 0
          ) {
            const uploadedPaths = await Promise.all(
              variant.attribute_image.map(async (image) => {
                if (image.base64File && image.fileName) {
                  const cleanedBase64File = image.base64File
                    .split(";base64,")
                    .pop();
                  // Upload the file to 'item-attribute'
                  return await fileUploadHelper.uploadSingleFile(
                    uploadFolder,
                    image.fileName.replace(/\s+/g, ""),
                    cleanedBase64File,
                  );
                }
                // Handle existing URLs/paths
                const relativePath = image.url
                  ? image.url.replace(process.env.BASE_URL, "")
                  : typeof image === "string"
                    ? image
                    : "";
                return relativePath;
              }),
            );
            variant.attribute_image = uploadedPaths.filter((p) => p !== "");
          }
        }),
      );
    }

    // Replace req.body.image with the uploaded paths
    // console.log(req.body,'req.body');

    const newItem = new Item(req.body);
    const savedItem = await newItem.save();

    // 📦 Log initial inventory (type: item)
    recordStockMovement({
      item: savedItem,
      previous_stock: 0,
      current_stock: savedItem.stock || 0,
      movement_type: "item",
      channel: "WEB_ADMIN",
      reference_type: "ITEM_CREATION",
      source_code: 1,
      source_name: "item",
      notes: `Item created with initial stock ${savedItem.stock || 0}`,
      updated_by: req.admin?.email || req.body?.created_by || "Admin",
      updated_by_id: req.admin?._id || null,
    });

    // 🔄 GMC Auto-Sync: enqueue product create sync job in background
    enqueueGmcJob({ action: "CREATE", itemId: savedItem._id });

    return res.status(201).json({
      status: "success",
      message: "Item created successfully",
      data: savedItem,
    });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed while creating the item",
        error: error.message,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error while creating the item",
      error: error.message,
    });
  }
};

// Import items
exports.importItems = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid input format: expected an array of items",
      });
    }
    const insertedItems = await Item.insertMany(items);

    // ⏸️ Sync history logging commented out as per requirement
    // if (insertedItems && insertedItems.length > 0) {
    //   const logs = insertedItems.map((it) => ({
    //     item: it,
    //     previous_stock: 0,
    //     current_stock: it.stock || 0,
    //     source_code: 3,
    //     source_name: "Sync",
    //     notes: "Stock updated via Sync",
    //     updated_by: req.admin?.email || "Admin",
    //   }));
    //   bulkRecordStockMovements(logs);
    // }
    return res.status(201).json({
      status: "success",
      message: `${insertedItems.length} items imported successfully`,
      data: insertedItems,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while importing items",
      error: error.message,
    });
  }
};

// Delete all items
exports.deleteAllItems = async (req, res) => {
  try {
    console.log("Deleting all items... in ItemController.js");
    const deletedItems = await Item.deleteMany({});
    return res.status(200).json({
      status: "success",
      message: `${deletedItems.deletedCount} items deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while deleting items",
      error: error.message,
    });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("item_group_id")
      .populate("category_id")
      .populate("brand_id")
      .populate("unit_id")
      .lean();
    if (!item) {
      return res.status(204).send(); // No Content if item not found
    }
    const processedItem = {
      ...item,
      image: item.image?.[0] || {}, // Safely access first image
    };
    if (item.image && item.image.length > 0) {
      console.log(item.image, "item.image");
      processedItem.images = item.image.map((img) => {
        if (!img) return { base64File: "", fileName: "", url: "" };
        try {
          // If img is already an object with url, use it, otherwise treat string as path
          const relativePath =
            typeof img === "string"
              ? img
              : img.url
                ? img.url.replace(process.env.BASE_URL, "")
                : "";
          // Safely resolve the file path to avoid double-slashes or unresolved '..' segments
          const filePath = path.resolve(
            getUploadBasePath(),
            relativePath.replace(/^\//, ""),
          );
          const { base64File, fileName } = pathToBase64(filePath);
          return {
            base64File: base64File ? `data:image/png;base64,${base64File}` : "",
            fileName:
              fileName ||
              (typeof relativePath === "string"
                ? relativePath.split("/").pop()
                : ""),
            url: relativePath ? `${process.env.BASE_URL}${relativePath}` : "",
          };
        } catch (err) {
          console.error(`Error processing image: ${err.message}`);
          // Fallback: return url so frontend can still try to load via HTTP
          const relativePath =
            typeof img === "string"
              ? img
              : img.url
                ? img.url.replace(process.env.BASE_URL, "")
                : "";
          return {
            base64File: "",
            fileName:
              typeof relativePath === "string"
                ? relativePath.split("/").pop()
                : "",
            url: relativePath ? `${process.env.BASE_URL}${relativePath}` : "",
          };
        }
      });
    } else {
      processedItem.images = [];
    }

    if (item.item_attribute?.variant) {
      await Promise.all(
        item.item_attribute.variant.map(async (variant) => {
          if (
            variant.attribute_image &&
            Array.isArray(variant.attribute_image)
          ) {
            const processedImages = variant.attribute_image.map((img) => {
              if (!img) return { base64File: "", fileName: "", url: "" };
              try {
                const relativePath =
                  typeof img === "string"
                    ? img
                    : img.url
                      ? img.url.replace(process.env.BASE_URL, "")
                      : "";
                const filePath = `${process.cwd()}/uploadFile${relativePath}`;
                const { base64File, fileName } = pathToBase64(filePath);
                return {
                  base64File: base64File
                    ? `data:image/png;base64,${base64File}`
                    : "",
                  fileName:
                    fileName ||
                    (typeof relativePath === "string"
                      ? relativePath.split("/").pop()
                      : ""),
                  url: relativePath
                    ? `${process.env.BASE_URL}${relativePath}`
                    : "",
                };
              } catch (err) {
                console.error(`Error processing variant image: ${err.message}`);
                return { base64File: "", fileName: "", url: "" };
              }
            });
            variant.attribute_image = processedImages;
          }
        }),
      );
    }

    // console.log(processedItem)

    return res.status(200).json(processedItem);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving the item",
      error: error.message,
    });
  }
};

// Update an item by ID
exports.updateItemById = async (req, res) => {
  try {
    sanitizeItemObjectIds(req.body);
    const item = await Item.findOne({ _id: req.params.id })
      .populate({ path: "category_id", match: { is_active: true } })
      .exec();

    // Capture previous images BEFORE any mutation for the audit log
    const previousImages = item?.image ? [...item.image] : [];

    const images = req.body.image;

    // Check if image field was explicitly sent in request body
    const imageFieldSent = Object.prototype.hasOwnProperty.call(
      req.body,
      "image",
    );

    if (Array.isArray(images) && images.length > 0) {
      // Has images — separate new uploads from existing
      const newImages = images.filter(
        (image) => image.base64File && image.fileName,
      );
      const existingImages = images.filter(
        (image) => !image.base64File || !image.fileName,
      );

      // Upload new images
      const uploadedPaths = await Promise.all(
        newImages.map(async (image) => {
          const { base64File, fileName } = image;
          const cleanedBase64File = base64File.split(";base64,").pop();
          return await fileUploadHelper.uploadSingleFile(
            `items/${item?.item_code}/${item?.category_id?.name?.replace(/\+/g, "_")?.replace(/[^\w\-]/g, "")}`,
            fileName.replace(/\s+/g, ""),
            cleanedBase64File,
          );
        }),
      );

      // Preserve existing image paths — skip default/placeholder paths
      const DEFAULT_PATH = "/default/default_image.png";
      const existingPaths = existingImages
        .map((image) => {
          if (typeof image === "string") return image;
          if (image.url) return image.url.replace(process.env.BASE_URL, "");
          return "";
        })
        .filter(
          (p) => p !== "" && !p.includes("/default/") && p !== DEFAULT_PATH,
        );

      // Merge: keep existing paths + add newly uploaded paths
      const allPaths = [...existingPaths, ...uploadedPaths].filter(Boolean);
      req.body.image =
        allPaths.length > 0 ? allPaths : ["/default/default_image.png"];
    } else if (imageFieldSent && Array.isArray(images) && images.length === 0) {
      // User explicitly sent image: [] — intentional removal, allow it
      req.body.image = ["/default/default_image.png"];
    } else {
      // image field not sent at all (undefined/null) — keep existing DB images to avoid accidental data loss
      const existingItem = await Item.findById(req.params.id)
        .select("image")
        .lean();
      req.body.image =
        existingItem?.image?.length > 0
          ? existingItem.image
          : ["/default/default_image.png"];
    }

    // Determine who triggered this (admin JWT info if available)
    const adminEmail = req.admin?.email || req.user?.email || null;
    const adminId = req.admin?._id || req.user?._id || null;
    // Detect if this came from the dedicated image-update drawer (only image field sent)
    const isImageOnlyUpdate =
      Object.keys(req.body).length === 1 && req.body.image;
    const triggerSource = isImageOnlyUpdate
      ? "image_update_drawer"
      : "admin_manual";

    // Process variant images during update
    if (Array.isArray(req.body?.item_attribute?.variant)) {
      await Promise.all(
        req.body.item_attribute.variant.map(async (variant) => {
          if (
            Array.isArray(variant.attribute_image) &&
            variant.attribute_image.length > 0
          ) {
            const uploadedPaths = await Promise.all(
              variant.attribute_image.map(async (image) => {
                if (image.base64File && image.fileName) {
                  const cleanedBase64File = image.base64File
                    .split(";base64,")
                    .pop();
                  // Upload the file to 'item-attribute' for variants
                  return await fileUploadHelper.uploadSingleFile(
                    `items/${item?.item_code}/${item?.category_id?.name?.replace(/\+/g, "_")?.replace(/[^\w\-]/g, "")}`,
                    image.fileName.replace(/\s+/g, ""),
                    cleanedBase64File,
                  );
                }
                // Handle existing URLs/paths correctly
                const relativePath = image.url
                  ? image.url.replace(process.env.BASE_URL, "")
                  : typeof image === "string"
                    ? image
                    : "";
                return relativePath;
              }),
            );
            variant.attribute_image = uploadedPaths.filter((p) => p !== "");
          }
        }),
      );
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedItem) {
      return res.status(204).send();
    }

    // 📦 Log inventory stock change
    const prevStock = item ? (item.stock || 0) : 0;
    const newStock = updatedItem ? (updatedItem.stock || 0) : 0;
    const stockFieldSent = Object.prototype.hasOwnProperty.call(req.body, "stock");

    if (stockFieldSent || prevStock !== newStock) {
      const notes = req.body?.notes || `Stock updated from ${prevStock} to ${newStock}`;

      recordStockMovement({
        item: updatedItem,
        previous_stock: prevStock,
        current_stock: newStock,
        source_code: 2,
        source_name: "stock",
        movement_type: "stock",
        notes,
        updated_by: adminEmail || "Admin",
        updated_by_id: adminId || null,
      });
    }

    // Log image change audit trail
    await logImageChange({
      item_id: updatedItem._id,
      item_code: updatedItem.item_code,
      item_name: updatedItem.name,
      previous_images: previousImages,
      new_images: updatedItem.image || [],
      triggered_by: triggerSource,
      changed_by_email: adminEmail,
      changed_by_id: adminId,
      req,
    });

    // 🔄 GMC Auto-Sync: enqueue product update sync job in background
    enqueueGmcJob({ action: "UPDATE", itemId: updatedItem._id });

    return res.status(200).json({
      status: "success",
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed while updating the item",
        error: error.message,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error while updating the item",
      error: error.message,
    });
  }
};

// exports.updateItemById = async (req, res) => {
//   try {

//     const item = await Item.findOne({ _id: req.params.id }).populate({ path: 'category_id', match: { is_active: true } }).exec();
//     const images = req.body.image; // Get image array from request body
//     if (Array.isArray(images) && images.length > 0) {
//       const uploadedPaths = await Promise.all(
//         images
//           .filter((image) => image.base64File && image.fileName)
//           .map(async (image) => {
//             const { base64File, fileName } = image;
//             const cleanedBase64File = base64File.split(';base64,').pop();
//             return await fileUploadHelper.uploadSingleFile(`items/${item?.item_code}/${item?.category_id?.name}`, fileName.replace(/\s+/g, ''), cleanedBase64File);
//           })
//       );
//       // Replace image array with uploaded paths
//       req.body.image = uploadedPaths;
//     } else {
//       req.body.image = '/default/default_image.png';
//     }

//     const updatedItem = await Item.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (!updatedItem) {
//       return res.status(204).send();
//     }
//     return res.status(200).json({
//       status: 'success',
//       message: 'Item updated successfully',
//       data: updatedItem
//     });

//   } catch (error) {
//     console.log(error)
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Validation failed while updating the item',
//         error: error.message
//       });
//     }
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error while updating the item',
//       error: error.message
//     });
//   }
// };

// Delete an item by ID
exports.deleteItemById = async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(204).send(); // No Content if item not found
    }

    // 🔄 GMC Auto-Sync: enqueue product delete job in background
    const offerId = deletedItem.item_code || deletedItem._id.toString();
    enqueueGmcJob({ action: "DELETE", offerId, itemId: deletedItem._id });

    return res.status(200).json({
      status: "success",
      message: "Item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while deleting the item",
      error: error.message,
    });
  }
};

// Get all items - Optimized Production Implementation
exports.getAllItems = async (req, res) => {
  try {
    function escapeRegex(text) {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    let { page, limit, q, itemGroup, category, stockMin, stockMax } = req.query;

    const hasPagination =
      (page && Number(page) > 0) ||
      (limit && Number(limit) > 0) ||
      (q && String(q).trim().length > 0) ||
      itemGroup ||
      category ||
      stockMin ||
      stockMax;

    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (currentPage - 1) * perPage;

    const query = {};

    // 1. Text search across Item fields and referenced Category/ItemGroup
    if (q && String(q).trim().length > 0) {
      const rawSearch = String(q).trim();
      const escaped = escapeRegex(rawSearch);
      const searchRegex = new RegExp(escaped, "i");

      // Search matching category and item group IDs in parallel
      const [matchingCategories, matchingGroups] = await Promise.all([
        CategoryModel.find({ name: searchRegex }).select("_id").lean(),
        itemGroupModel.find({ name: searchRegex }).select("_id").lean(),
      ]);

      const catIds = matchingCategories.map((c) => c._id);
      const groupIds = matchingGroups.map((g) => g._id);

      const orQuery = [
        { name: searchRegex },
        { alias: searchRegex },
        { print_name: searchRegex },
        { hsn_code: searchRegex },
        { item_code: searchRegex },
        { short_description: searchRegex },
        { long_description: searchRegex },
      ];

      if (catIds.length > 0) {
        orQuery.push({ category_id: { $in: catIds } });
      }
      if (groupIds.length > 0) {
        orQuery.push({ item_group_id: { $in: groupIds } });
      }

      const qNum = Number(rawSearch);
      if (!Number.isNaN(qNum)) {
        orQuery.push({ mrp: qNum });
        orQuery.push({ sale_price: qNum });
      }

      query.$or = orQuery;
    }

    // 2. Filter by Item Group
    if (itemGroup && String(itemGroup).trim()) {
      const escapedGroup = escapeRegex(String(itemGroup).trim());
      const matchingGroups = await itemGroupModel
        .find({ name: new RegExp(escapedGroup, "i") })
        .select("_id")
        .lean();
      query.item_group_id = { $in: matchingGroups.map((g) => g._id) };
    }

    // 3. Filter by Category
    if (category && String(category).trim()) {
      const escapedCat = escapeRegex(String(category).trim());
      const matchingCats = await CategoryModel
        .find({ name: new RegExp(escapedCat, "i") })
        .select("_id")
        .lean();
      query.category_id = { $in: matchingCats.map((c) => c._id) };
    }

    // 4. Filter by Stock
    if (stockMin !== undefined && stockMin !== "" && !isNaN(Number(stockMin))) {
      query.stock = { ...query.stock, $gte: Number(stockMin) };
    }
    if (stockMax !== undefined && stockMax !== "" && !isNaN(Number(stockMax))) {
      query.stock = { ...query.stock, $lte: Number(stockMax) };
    }

    // Fast indexed count and paginated query in parallel
    const [totalDoc, items] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query)
        .select("-long_description -specification -item_attribute.checkedItems -item_attribute.groupArrSelections")
        .populate("category_id", "name _id")
        .populate("item_group_id", "name _id")
        .populate("brand_id", "name _id")
        .populate("unit_id", "name _id")
        .sort({ _id: -1 })
        .skip(hasPagination ? skip : 0)
        .limit(hasPagination ? perPage : (req.query.all ? 10000 : perPage))
        .lean(),
    ]);

    // Format images efficiently without blocking disk reads
    const baseUrl = process.env.BASE_URL || "";
    const processed = items.map((item) => {
      const processedItem = {
        ...item,
        image: item.image?.[0] || {},
      };

      if (item.image && Array.isArray(item.image) && item.image.length > 0) {
        processedItem.images = item.image.map((img) => {
          if (!img) return { base64File: "", fileName: "", url: "" };
          const relativePath =
            typeof img === "string"
              ? img
              : img.url
                ? img.url.replace(baseUrl, "")
                : img.path || img.filePath || "";
          return {
            base64File: "",
            fileName: typeof relativePath === "string" ? relativePath.split("/").pop() : "",
            url: relativePath
              ? (relativePath.startsWith("http") ? relativePath : `${baseUrl}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`)
              : "",
          };
        });
      } else {
        processedItem.images = [];
      }
      return processedItem;
    });

    if (hasPagination) {
      return res.status(200).json({
        items: processed,
        totalDoc,
        limits: perPage,
        pages: currentPage,
      });
    }

    return res.status(200).json(processed);
  } catch (error) {
    console.error("Error in getAllItems:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving items",
      error: error.message,
    });
  }
};

// exports.activeItems = async (req, res) => {

//   try {
//     const Items = await Item.find({ is_active: true }).select('_id name image stock');
//     res.status(200).json(Items);
//   } catch (error) {
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error while retrieving items',
//       error: error.message
//     });
//   }
// };

exports.activeItems = async (req, res) => {
  try {
    const Items = await Item.find(
      {
        is_active: true,
        // name: "Trv DC50 BLACK/WHITE 7x10"   // ➜ your condition
      },
      {
        _id: 1,
        name: 1,
        stock: 1,
        image: { $slice: 1 }, // ➜ only first image
      },
    );
    res.status(200).json(Items);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving items",
      error: error.message,
    });
  }
};

// exports.showItem = async (req, res) => {
//   try {

//     const items = await Item.find().populate('category_id item_group_id brand_id unit_id').lean();
//     const formattedItems = items.map(item => ({
//       prices: {
//         price: item.sale_price,
//         originalPrice: item.mrp,
//         discount: item.discount
//       },
//       categories: [item.category_id?._id],
//       image: item.image,
//       tag: ["[\"shoe\",\"footwear\",\"apparel\"]"],
//       variants: item.item_attribute?.variant.map((variant, index) => ({
//         originalPrice: variant.price,
//         price: variant.selling_price,
//         quantity: variant.stock,
//         discount: item.vendor_discount,
//         productId: `${item._id}-${index}`,
//         barcode: "",
//         sku: "",
//         image: "",
//         ...(variant.groupArrSelections || {})
//       })) || [],
//       status: "show",
//       _id: item._id,
//       productId: item._id,
//       sku: "",
//       barcode: "",
//       title: { en: item.name },
//       description: { en: item.specification },
//       slug: item.name.toLowerCase().replace(/\s+/g, "-"),
//       category: item.category_id?._id,
//       stock: item.item_attribute?.variant.reduce((sum, v) => sum + Number(v.stock), 0) || 0,
//       isCombination: true,
//       createdAt: item.created_date,
//       updatedAt: item.modified_date,
//       sales: 0,
//       __v: item.__v
//     }));
//     return res.send(JSON.stringify(formattedItems, null, 2));
//   } catch (error) {
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error while retrieving items',
//       error: error.message
//     });
//   }
// };

exports.showItem = async (req, res) => {
  try {
    const activeItemGroups = await itemGroupModel.find({
      is_active: true,
      $or: [{ showOnWebsite: true }, { showOnWebsite: { $exists: false } }],
    }).select("_id");
    const activeItemGroupIds = activeItemGroups.map((ig) => ig._id);

    const items = await Item.find(
      {
        is_active: true,
        $or: [{ showOnWebsite: true }, { showOnWebsite: { $exists: false } }],
        $or: [
          { item_group_id: { $in: activeItemGroupIds } },
          { item_group_id: { $exists: false } },
          { item_group_id: null },
        ],
      },
      "name specification mrp sale_price discount image category_id item_group_id brand_id unit_id item_attribute.variant stock sku barcode created_date modified_date sales __v",
    )
      .populate("category_id item_group_id brand_id unit_id")
      .lean();

    const formattedItems = items.map((item) => ({
      prices: {
        price: item.sale_price > 0 ? item.sale_price : (item.mrp ?? 0),
        originalPrice: item.mrp ?? 0,
        discount: item.discount ?? 0,
      },
      categories: item.category_id?._id ? [item.category_id._id] : [], // Ensure no undefined values
      image: item.image ?? "",
      // tag: ["shoe", "footwear", "apparel"], // Ensure valid array
      tag: ['["shoe","footwear","apparel"]'],
      variants: (item.item_attribute?.variant ?? []).map((variant, index) => {
        const variantPrice = variant?.selling_price ?? variant?.price ?? 0;
        const variantOriginalPrice = variant?.price ?? item.mrp ?? 0;
        return {
          originalPrice: variantOriginalPrice,
          price: variantPrice > 0 ? variantPrice : variantOriginalPrice,
          quantity: variant.stock ?? 0,
          discount: item.vendor_discount ?? 0,
          productId: `${item._id}-${index}`,
          barcode: variant.barcode ?? "",
          sku: variant.sku ?? "",
          image: variant.image ?? "",
          ...(variant.groupArrSelections ?? {}), // Ensure it's an object or empty
        };
      }),
      status: "show",
      _id: item._id ?? null, // Ensure no undefined values
      productId: item._id ?? null,
      sku: item.sku ?? "",
      barcode: item.barcode ?? "",
      title: { en: item.name ?? "" },
      description: { en: item.specification ?? "" },
      slug: item.name ? item.name.toLowerCase().replace(/\s+/g, "-") : "",
      category: item.category_id?._id ?? null, // Prevent undefined in JSON
      stock:
        item.stock ||
        (item.item_attribute?.variant ?? []).reduce(
          (sum, v) => sum + (Number(v.stock) || 0),
          0,
        ),
      isCombination: true,
      createdAt: item.created_date ?? new Date(),
      updatedAt: item.modified_date ?? new Date(),
      sales: item.sales ?? 0,
      __v: item.__v ?? 0,
    }));

    return res.json(formattedItems);
  } catch (error) {
    console.error("Error retrieving items:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving items",
      error: error.message,
    });
  }
};

exports.getItemCode = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) throw new Error("Item not found in fetching item code");
    res.status(200).json({ item_code: item.item_code });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getItemDiscount = async (req, res) => {
  try {
    const { ItemCode, PartyCode } = req.body;
    if (!ItemCode || !PartyCode) {
      return res
        .status(400)
        .json({ message: "Item code and party code are required" });
    }
    const response = await axios.post(
      "https://busyapi.selectionfootwear.com/Item/GetItemDiscount",
      {
        PartyCode: PartyCode,
        ItemCode: ItemCode,
      },
    );
    // console.log("Item Discount: ", response.data.Data);
    return res.json(response.data.Data);
  } catch (error) {
    console.error("Error retrieving item discount:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving item discount",
      error: error.message,
    });
  }
};

// Dedicated stock sync endpoint
exports.syncStockData = async (req, res) => {
  try {
    console.log("🔄 Starting stock synchronization...");
    const response = await axios.post(
      "https://busyapi.selectionfootwear.com/Item/GetItem",
    );

    if (response.data.Data && response.data.Data.length > 0) {
      const apiItems = response.data.Data;
      console.log(
        `📦 Preparing bulk stock sync for ${apiItems.length} items...`,
      );

      const bulkOps = apiItems.map((item) => {
        const stockValue = item.MainTransBal || 0;
        return {
          updateOne: {
            filter: { item_code: item.ItemCode },
            update: {
              $set: {
                stock: stockValue,
                "item_attribute.variant.0.stock": stockValue,
                modified_date: new Date(),
              },
            },
          },
        };
      });

      const result = await Item.bulkWrite(bulkOps);

      console.log(
        `🎉 Stock sync completed: ${result.nMatched} items matched, ${result.nModified} items modified`,
      );
      res.status(200).json({
        message: "Stock sync completed successfully",
        matched: result.nMatched,
        modified: result.nModified,
        total: apiItems.length,
      });
    } else {
      console.error("❌ API returned no stock data");
      res.status(400).json({ message: "API returned no stock data" });
    }
  } catch (error) {
    console.error("❌ Error syncing stock data:", error.message);
    res
      .status(500)
      .json({ message: "Error syncing stock data", error: error.message });
  }
};

// Update stock by item_code
exports.updateStockByItemCode = async (req, res) => {
  try {
    const { item_code } = req.params;
    const { stock } = req.body;
    if (!item_code) {
      return res.status(400).json({ message: "Item code is required" });
    }
    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: "Stock quantity is required" });
    }
    if (isNaN(Number(stock))) {
      return res.status(400).json({ message: "Stock must be a valid number" });
    }
    const stockValue = Number(stock);
    // Find item by item_code
    const item = await Item.findOne({ item_code: Number(item_code) });
    if (!item) {
      return res
        .status(404)
        .json({ message: "Item not found with the provided item_code" });
    }

    // Update stock
    const updatedItem = await Item.findOneAndUpdate(
      { item_code: Number(item_code) },
      {
        stock: stockValue,
        modified_date: new Date(),
      },
      { new: true, runValidators: true },
    );

    // 📦 Log inventory stock change (type: stock)
    recordStockMovement({
      item: updatedItem,
      previous_stock: item.stock || 0,
      current_stock: stockValue,
      source_code: 2,
      source_name: "stock",
      movement_type: "stock",
      notes: req.body?.notes || `Stock updated to ${stockValue}`,
      updated_by: req.admin?.email || req.body?.updated_by || "Admin",
      updated_by_id: req.admin?._id || null,
    });

    // Also update variant stock if item has variants
    // if (updatedItem.item_attribute?.variant && updatedItem.item_attribute.variant.length > 0) {
    //   await Item.findOneAndUpdate(
    //     { item_code: Number(item_code) },
    //     {
    //       'item_attribute.variant.$[].stock': stockValue,
    //       modified_date: new Date()
    //     },
    //     { new: true }
    //   );
    // }

    return res.status(200).json({
      message: "Stock updated successfully",
      // item_code: updatedItem.item_code,
      // stock: updatedItem.stock
    });
  } catch (error) {
    console.error("Error updating stock by item_code:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while updating stock",
      error: error.message,
    });
  }
};

// Get stock quantity by item_code (path parameter)
exports.getStockByItemCode = async (req, res) => {
  try {
    const { item_code } = req.params;

    if (!item_code) {
      return res.status(400).json({ message: "Item code is required" });
    }

    // Find item by item_code
    const item = await Item.findOne({ item_code: Number(item_code) })
      .select("item_code name stock item_attribute.variant.stock")
      .lean();

    if (!item) {
      return res
        .status(404)
        .json({ message: "Item not found with the provided item_code" });
    }

    // Calculate total stock (main stock + variant stocks if available)
    let totalStock = item.stock || 0;

    if (
      item.item_attribute?.variant &&
      Array.isArray(item.item_attribute.variant)
    ) {
      const variantStock = item.item_attribute.variant.reduce((sum, v) => {
        return sum + (Number(v.stock) || 0);
      }, 0);
      // If variants have stock, use that; otherwise use main stock
      if (variantStock > 0) {
        totalStock = variantStock;
      }
    }

    return res.status(200).json({
      item_code: item.item_code,
      name: item.name,
      stock: totalStock,
      main_stock: item.stock || 0,
      variant_stock:
        item.item_attribute?.variant?.reduce(
          (sum, v) => sum + (Number(v.stock) || 0),
          0,
        ) || 0,
    });
  } catch (error) {
    console.error("Error getting stock by item_code:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving stock",
      error: error.message,
    });
  }
};

exports.syncItemData = async (req, res) => {
  try {
    const response = await axios.post(
      "https://busyapi.selectionfootwear.com/Item/GetItem",
    );

    if (!response.data?.Data || response.data.Data.length === 0) {
      console.error("API returned no data or invalid format");
      return res
        .status(400)
        .json({ message: "API returned no data or invalid format" });
    }

    const items = response.data.Data;
    console.log(`Total items to sync: ${items.length}`);

    // Pre-fetch Color and Size attributes (Singular model uses name.en or title.en)
    let colorAttr = await Attribute.findOne({
      $or: [{ "name.en": /color/i }, { name: /color/i }],
    });
    let sizeAttr = await Attribute.findOne({
      $or: [{ "name.en": /size/i }, { name: /size/i }],
    });

    // Create or update attributes to ensure they have status: "show"
    if (!colorAttr) {
      colorAttr = await Attribute.create({
        name: { en: "Color" },
        title: { en: "Color" },
        option: "Dropdown",
        status: "show",
      });
    } else if (colorAttr.status !== "show") {
      colorAttr.status = "show";
      await colorAttr.save();
    }

    if (!sizeAttr) {
      sizeAttr = await Attribute.create({
        name: { en: "Size" },
        title: { en: "Size" },
        option: "Dropdown",
        status: "show",
      });
    } else if (sizeAttr.status !== "show") {
      sizeAttr.status = "show";
      await sizeAttr.save();
    }

    const getAttrValue = async (name, attr) => {
      if (!name || !attr) return null;
      const normalizedName = name.trim().toLowerCase();

      // Ensure variants array exists
      if (!attr.variants) attr.variants = [];

      // Singular model stores values in 'variants' array
      let variant = attr.variants.find(
        (v) =>
          (typeof v.name === "string" &&
            v.name.toLowerCase() === normalizedName) ||
          v.name?.en?.toLowerCase() === normalizedName,
      );

      if (!variant) {
        const newId = new mongoose.Types.ObjectId();
        const newVariant = {
          _id: newId,
          name: { en: name.trim() },
          status: "show",
        };

        await Attribute.updateOne(
          { _id: attr._id },
          { $push: { variants: newVariant } },
        );

        // Update local object to avoid stale find() in next iteration
        attr.variants.push(newVariant);
        return newId;
      }
      return variant._id;
    };

    // Group items by ItemCode to handle variants, skip null codes
    const groupedItems = items.reduce((acc, item) => {
      const code = item.ItemCode;
      if (code === undefined || code === null) return acc;
      if (!acc[code]) acc[code] = [];
      acc[code].push(item);
      return acc;
    }, {});

    const uniqueItemCodes = Object.keys(groupedItems);
    const uniqueItemCodesAsNumbers = uniqueItemCodes
      .map(Number)
      .filter((n) => !isNaN(n));
    console.log(`Total unique items to sync: ${uniqueItemCodes.length}`);

    // Delete items from our database that have an item_code but are no longer present in busyapi
    if (uniqueItemCodesAsNumbers.length > 0) {
      // 🐛 DEBUG LOGS: Find out exactly which items are going to be deleted
      const itemsToDelete = await Item.find({
        item_code: { $nin: uniqueItemCodesAsNumbers, $exists: true, $ne: null },
      })
        .select("item_code name")
        .lean();

      console.log(`\n============== DEBUG INFO ================`);
      console.log(
        `BusyAPI sent ${uniqueItemCodesAsNumbers.length} valid item codes.`,
      );
      console.log(
        `Found ${itemsToDelete.length} items in local DB missing from BusyAPI.`,
      );
      if (itemsToDelete.length > 0) {
        console.log(
          "These items will be DELETED:",
          JSON.stringify(itemsToDelete, null, 2),
        );
      }
      console.log(`==========================================\n`);

      const deleteResult = await Item.deleteMany({
        item_code: { $nin: uniqueItemCodesAsNumbers, $exists: true, $ne: null },
      });
      console.log(
        `Deleted ${deleteResult.deletedCount} items that are no longer in busyapi.`,
      );
    }

    // Pre-fetch all metadata to avoid thousands of findOne calls
    const [allItemGroups, allCategories, allUnits] = await Promise.all([
      itemGroupModel.find({}).lean(),
      CategoryModel.find({}).lean(),
      UnitModel.find({}).lean(),
    ]);

    const itemGroupMap = new Map(
      allItemGroups.map((ig) => [ig.code?.toString(), ig]),
    );
    const categoryMap = new Map(
      allCategories.map((c) => [c.name?.toLowerCase(), c]),
    );
    const unitMap = new Map(allUnits.map((u) => [u.name?.toLowerCase(), u]));

    const BATCH_SIZE = 100;

    for (let i = 0; i < uniqueItemCodes.length; i += BATCH_SIZE) {
      const batchCodes = uniqueItemCodes.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchCodes.length} items)`,
      );

      const promises = batchCodes.map(async (code) => {
        try {
          const itemEntries = groupedItems[code];
          const firstEntry = itemEntries[0];

          const itemGroup = itemGroupMap.get(
            firstEntry.ParentGrpCode?.toString(),
          );
          if (!itemGroup) {
            console.error(
              `❌ Item group not found for code: ${firstEntry.ParentGrpCode}`,
            );
            return;
          }

          let categoryName = firstEntry.CategoryName || "General";
          let category = categoryMap.get(categoryName.toLowerCase());
          if (!category) {
            category = await new CategoryModel({
              name: categoryName,
              description: "Default category for items without one",
              is_active: true,
              status: "show",
            }).save();
            categoryMap.set(
              categoryName.toLowerCase(),
              category.toObject ? category.toObject() : category,
            );
          }

          const unit = unitMap.get(firstEntry.MainUnit?.toLowerCase());
          if (!unit) {
            console.error(`❌ Unit not found for name: ${firstEntry.MainUnit}`);
            return;
          }

          const existingItem = await Item.findOne({ item_code: code });
          let currentVariants = existingItem?.item_attribute?.variant
            ? existingItem.item_attribute.variant.map((v) =>
                v.toObject ? v.toObject() : v,
              )
            : [];

          // Use a Map to deduplicate variants based on color and size
          const variantMap = new Map();
          const apiVariantKeys = new Set(); // To track variants found in current API batch

          // Initialize map with existing variants from DB
          currentVariants.forEach((v) => {
            const vColor = v.color || v.groupArrSelections?.Color || "";
            const vSize = v.size || v.groupArrSelections?.Size || "";
            const key = `${vColor}-${vSize}`.toLowerCase().trim();
            variantMap.set(key, v);
          });

          // Process current API entries for this ItemCode
          for (const entry of itemEntries) {
            const color = entry.ItemColour || entry.ItemColor || "";
            const size = entry.ItemSize || "";

            // Only push to variant if color or size exists
            if (!color && !size) continue;

            const key = `${color}-${size}`.toLowerCase().trim();

            // Get attribute value IDs for groupArrSelections
            const groupArrSelections = {};
            if (color && colorAttr) {
              const colorValId = await getAttrValue(color, colorAttr);
              if (colorValId) groupArrSelections[colorAttr._id] = colorValId;
            }
            if (size && sizeAttr) {
              const sizeValId = await getAttrValue(size, sizeAttr);
              if (sizeValId) groupArrSelections[sizeAttr._id] = sizeValId;
            }

            const variantData = {
              ...(color && { color }),
              ...(size && { size }),
              stock: entry.MainTransBal || 0,
              price: entry.VendorPrice || 0,
              selling_price: entry.VendorPrice || 0,
              groupArrSelections,
            };

            if (apiVariantKeys.has(key)) {
              // If multiple entries for SAME variant in SAME API batch, sum their stock
              const existing = variantMap.get(key);
              variantMap.set(key, {
                ...existing,
                ...variantData,
                stock: (existing.stock || 0) + (variantData.stock || 0),
              });
            } else {
              // First encounter in API for this variant, replace old DB data but keep extra fields (like attribute_image)
              const existing = variantMap.get(key);
              variantMap.set(key, { ...existing, ...variantData });
              apiVariantKeys.add(key);
            }
          }

          const finalVariants = Array.from(variantMap.values());
          const totalStock = finalVariants.reduce(
            (sum, v) => sum + (Number(v.stock) || 0),
            0,
          );

          // Prepare item_attribute by spreading existing to preserve fields like gst, offer, checkedItems
          const existingAttr = existingItem?.item_attribute
            ? existingItem.item_attribute.toObject
              ? existingItem.item_attribute.toObject()
              : existingItem.item_attribute
            : {};

          const itemData = {
            name: firstEntry.ItemName,
            alias: firstEntry.ItemAlias,
            hsn_code: firstEntry.HSNCode,
            sale_price: firstEntry.VendorPrice,
            mrp: firstEntry.CustomerPrice,
            item_code: code,
            item_group_id: itemGroup._id,
            category_id: category._id,
            unit_id: unit._id,
            alternate_unit: firstEntry.AltUnit,
            stock: totalStock,
            discount: firstEntry.AbsoluteDiscount,
            item_attribute: {
              ...existingAttr,
              variant: finalVariants,
              color: [
                ...new Set(finalVariants.map((v) => v.color).filter(Boolean)),
              ].join(", "),
              size: [
                ...new Set(finalVariants.map((v) => v.size).filter(Boolean)),
              ].join(", "),
              checkedItems: {
                ...(colorAttr && { [colorAttr._id]: true }),
                ...(sizeAttr && { [sizeAttr._id]: true }),
              },
            },
            is_active: true,
            conversion_factor: firstEntry.ConFactor,
            modified_date: new Date(),
          };

          // Preserve image if it already exists in DB
          const previousImages = existingItem?.image
            ? [...existingItem.image]
            : [];
          if (
            existingItem &&
            existingItem.image &&
            existingItem.image.length > 0
          ) {
            itemData.image = existingItem.image;
          }

          const savedItem = await Item.findOneAndUpdate(
            { item_code: code },
            { $set: itemData },
            { upsert: true, new: true },
          );

          // Log image change if images changed during sync
          const newImages = savedItem?.image || [];
          const prevStr = JSON.stringify(previousImages);
          const newStr = JSON.stringify(newImages);
          if (prevStr !== newStr) {
            await logImageChange({
              item_id: savedItem._id,
              item_code: Number(code),
              item_name: firstEntry.ItemName,
              previous_images: previousImages,
              new_images: newImages,
              triggered_by: "sync_cron",
              notes: "Automatic sync from BusyAPI",
            });
          }

          // ⏸️ Sync history logging commented out as per requirement:
          // const prevStock = existingItem ? (Number(existingItem.stock) || 0) : 0;
          // if (!existingItem || prevStock !== totalStock) {
          //   recordStockMovement({
          //     item: savedItem,
          //     previous_stock: prevStock,
          //     current_stock: totalStock,
          //     movement_type: "stock",
          //     channel: "BUSY_ERP",
          //     source_code: 3,
          //     source_name: "Sync",
          //   });
          // }
        } catch (err) {
          console.error(`Error processing item ${code}: ${err.message}`);
        }
      });

      await Promise.all(promises);
    }

    console.log("✅ Item sync completed successfully");
    res.status(200).json({ message: "Item sync completed successfully" });
  } catch (error) {
    console.error("❌ Error syncing item data:", error.message);
    res
      .status(500)
      .json({ message: "Error syncing item data", error: error.message });
  }
};

// exports.syncItemData = async (req, res) => {
//   try {
//     const response = await axios.post('https://busyapi.selectionfootwear.com/Item/GetItem');
//     if (response.data.Data && response.data.Data.length > 0) {
//       const items = response.data.Data;
//       console.log(`Syncing ${items.length} items...`);
//       for (const item of items) {
//         try {
//           const itemGroup = await itemGroupModel.findOne({ code: item.ParentGrpCode });
//           if (!itemGroup) {
//             console.error(`Item group not found for code: ${item.ParentGrpCode}`);
//             continue;
//           }
//           const category = await CategoryModel.findOne( { name: item.CategoryName });
//           if (!category) {
//             console.error(`Category not found for name: ${item.CategoryName}`);
//             continue;
//           }
//           const unit = await UnitModel.findOne({ name: item.MainUnit });
//           if (!unit) {
//             console.error(`Unit not found for name: ${item.MainUnit}`);
//             continue;
//           }
//           const itemData = {
//             name: item.ItemName,
//             alias: item.ItemAlias,
//             hsn_code: item.HSNCode,
//             sale_price: item.VendorPrice,
//             mrp: item.CustomerPrice,
//             item_code: item.ItemCode,
//             item_group_id: itemGroup._id,
//             category_id: category._id,
//             unit_id: unit._id,
//             alternate_unit: item.AltUnit,
//             // image: [],
//             // ✅ ADD STOCK MAPPING FROM MainTransBal
//             stock: item.MainTransBal || 0,
//             item_attribute: {
//               color: item.ItemColour,
//               size: item.ItemSize,
//               // ✅ ADD STOCK TO VARIANT AS WELL
//               variant: [{
//                 stock: item.MainTransBal || 0,
//                 price: item.VendorPrice || 0,
//                 selling_price: item.CustomerPrice || 0
//               }]
//             },
//             is_active: true,
//             conversion_factor:item.ConFactor
//           };
//           const existingItem = await Item.findOne({ item_code: item.ItemCode });
//           if (existingItem) {
//             await Item.findOneAndUpdate(
//               { item_code: item.ItemCode },
//               itemData,
//               { new: true }
//             );
//             // console.log(`Updated item: ${item.ItemName}`);
//           } else {
//             // Create new item
//             await Item.create(itemData);
//             // console.log(`Created new item: ${item.ItemName}`);
//           }
//         } catch (error) {
//           console.error(`Error processing item ${item.ItemName}:`, error.message);
//         }
//       }

//       console.log('Item sync completed successfully');
//       res.status(200).json({ message: 'Item sync completed successfully' });
//     } else {
//       console.error('API returned error status or no data');
//       res.status(400).json({ message: 'API returned error status or no data' });
//     }
//   } catch (error) {
//     console.log(" Error in syncing item at backend", error);
//     console.error('Error syncing item data:', error.message);
//     res.status(500).json({ message: 'Error syncing item data' });
//   }
// };
