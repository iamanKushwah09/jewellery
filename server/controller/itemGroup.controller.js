const ItemGroup = require("../models/itemGroup.model");
const { CREATE_MESSAGE, DELETE_MESSAGE, UPDATE_MESSAGE } = require("../enum");
const fileUploadHelper = require("../fileUploader/fileUploadHelper");
const { pathToBase64 } = require("../common/folderToBase64");
const axios = require("axios");

// Create a new item group
exports.createItemGroup = async (req, res) => {
  try {
    // const { base64File, fileName } = req.body.image;
    // if (!fileName) return res.status(400).json("Image must be selected.")
    // if (base64File) {
    //   const cleanedBase64File = base64File.split(';base64,').pop();
    //   const uploadPath = await fileUploadHelper.uploadSingleFile(`item-group`, fileName, cleanedBase64File);
    //   req.body.image = uploadPath;
    // }

    const images = req.body.image; // Assuming `req.body.image` is an array of image objects
    if (!Array.isArray(images)) {
      return res
        .status(400)
        .json({ message: "Invalid input: `image` should be an array." });
    }
    const uploadedPaths = await Promise.all(
      images
        .filter((image) => image.base64File && image.fileName) // Remove objects with blank or undefined keys
        .map(async (image) => {
          const { base64File, fileName } = image;
          const cleanedBase64File = base64File.split(";base64,").pop();
          // Upload the file
          return await fileUploadHelper.uploadSingleFile(
            `itemgroup`,
            fileName,
            cleanedBase64File,
          );
        }),
    );
    // Replace req.body.image with the uploaded paths
    req.body.image = uploadedPaths.length > 0 ? uploadedPaths[0] : "";

    if (
      typeof req.body.moq === "undefined" ||
      req.body.moq === null ||
      req.body.moq === "" ||
      req.body.moq === 0
    ) {
      req.body.moq = 6; // Set default if not provided
    }
    if (typeof req.body.showOnWebsite === "undefined") {
      req.body.showOnWebsite = true;
    }

    const newItemGroup = new ItemGroup(req.body);
    const savedItemGroup = await newItemGroup.save();
    res.status(201).json({ message: `Item group ${CREATE_MESSAGE}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get item group by ID
exports.getItemGroupById = async (req, res) => {
  try {
    const itemGroup = await ItemGroup.findById(req.params.id);
    if (!itemGroup) return res.status(404).json({ error: "Item group not found" });

    const fs = require("fs");
    const path = require("path");
    let base64File = "";
    let fileName = "";

    if (itemGroup.image && typeof itemGroup.image === "string") {
      fileName = itemGroup.image.split("/").pop() || "";
      try {
        const fullPath = path.resolve(process.cwd(), "uploadFile", itemGroup.image.replace(/^\//, ""));
        if (fs.existsSync(fullPath)) {
          const resPath = pathToBase64(fullPath);
          if (resPath?.base64File) {
            base64File = `data:image/png;base64,${resPath.base64File}`;
          }
        }
      } catch (err) {
        console.error("Error reading itemGroup image file:", err.message);
      }
    }

    const itemGroupWithImage = {
      ...itemGroup.toObject(),
      base64File,
      fileName,
      url: itemGroup.image ? `${process.env.BASE_URL}${itemGroup.image}` : "",
    };
    res.status(200).json(itemGroupWithImage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Update an item group by ID
exports.updateItemGroupById = async (req, res) => {
  try {
    const images = req.body.image;
    if (Array.isArray(images) && images.length > 0) {
      const uploadedPaths = await Promise.all(
        images.map(async (image) => {
          if (image.base64File && image.fileName) {
            if (
              typeof image.base64File === "string" &&
              (image.base64File.startsWith("data:") || image.base64File.includes(";base64,"))
            ) {
              const { base64File, fileName } = image;
              const cleanedBase64File = base64File.split(";base64,").pop();
              return await fileUploadHelper.uploadSingleFile(
                `itemgroup`,
                fileName,
                cleanedBase64File,
              );
            }
            if (typeof image.base64File === "string") {
              return image.base64File.replace(process.env.BASE_URL || "", "");
            }
          }
          if (image.url) {
            return image.url.replace(process.env.BASE_URL || "", "");
          }
          if (typeof image === "string") return image;
          return "";
        }),
      );
      const finalImage = uploadedPaths.find((p) => p !== "");
      req.body.image = finalImage !== undefined ? finalImage : "";
    } else if (!req.body.image && req.body.image !== "") {
      delete req.body.image;
    }

    const updatedItemGroup = await ItemGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedItemGroup) throw new Error("Item group not found");
    res.status(200).json({ message: `Item group ${UPDATE_MESSAGE}`, data: updatedItemGroup });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an item group by ID
exports.deleteItemGroupById = async (req, res) => {
  try {
    console.log({ r: req.params.id });
    const deletedItemGroup = await ItemGroup.findByIdAndDelete(req.params.id);
    if (!deletedItemGroup) throw new Error("Item group not found");
    res.status(200).json({ message: `Item group ${DELETE_MESSAGE}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete all itemGroups
exports.deleteAllItemGroups = async (req, res) => {
  try {
    const deletedItemGroups = await ItemGroup.deleteMany({});
    return res.status(200).json({
      status: "success",
      message: `${deletedItemGroups.deletedCount} itemGroups deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error while deleting itemGroups",
      error: error.message,
    });
  }
};

// Get all item groups
// exports.getAllItemGroups = async (req, res) => {
//   try {
//     const itemGroups = await ItemGroup.find();
//     res.status(200).json(itemGroups);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
exports.getAllItemGroups = async (req, res) => {
  try {
    const { page, limit, q } = req.query;
    // If pagination or search is requested, use paginated response
    if (
      (page && Number(page) > 0) ||
      (limit && Number(limit) > 0) ||
      (q && String(q).trim().length > 0)
    ) {
      const currentPage = Math.max(1, Number(page) || 1);
      const perPage = Math.max(1, Math.min(100, Number(limit) || 10));
      const skip = (currentPage - 1) * perPage;
      // Build search query
      const query = {};
      if (q && String(q).trim().length > 0) {
        const search = String(q).trim();
        const orQuery = [
          { name: { $regex: search, $options: "i" } },
          { alias: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
        // If q is a number, also try to match code equality
        const qNum = Number(search);
        if (!Number.isNaN(qNum)) {
          orQuery.push({ code: qNum.toString() });
          orQuery.push({ moq: qNum });
          orQuery.push({ discount: qNum });
        }
        query.$or = orQuery;
      }

      const totalDoc = await ItemGroup.countDocuments(query);
      const itemGroups = await ItemGroup.find(query)
        .populate({
          path: "parent_id",
          select: "name", // Select only the `name` field from the parent
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
      // Map the results to include `parent_name` alias
      const resultWithAlias = itemGroups.map((item) => ({
        ...item,
        parent_name: item.parent_id ? item.parent_id.name : null, // Assign the parent name to `parent_name`
        parent_id: undefined, // Optionally remove `parent_id` if not needed
      }));

      return res.status(200).json({
        itemGroups: resultWithAlias,
        totalDoc,
        limits: perPage,
        pages: currentPage,
      });
    }
    // Default: keep legacy behavior (return full array without pagination)
    const itemGroups = await ItemGroup.find()
      .sort({ _id: -1 })
      .populate({
        path: "parent_id",
        select: "name", // Select only the `name` field from the parent
      })
      .lean(); // Convert Mongoose documents to plain objects for further manipulation
    // Map the results to include `parent_name` alias
    const resultWithAlias = itemGroups.map((item) => ({
      ...item,
      parent_name: item.parent_id ? item.parent_id.name : null, // Assign the parent name to `parent_name`
      parent_id: undefined, // Optionally remove `parent_id` if not needed
    }));

    return res.status(200).json(resultWithAlias);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while retrieving item groups",
      error: error.message,
    });
  }
};

exports.activeItemGroups = async (req, res) => {
  try {
    const itemGroups = await ItemGroup.find({ is_active: true }).select(
      "_id name",
    );
    res.status(200).json(itemGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get item groups visible on store/website
exports.showItemGroups = async (req, res) => {
  try {
    const itemGroups = await ItemGroup.find({
      is_active: true,
      $or: [{ showOnWebsite: true }, { showOnWebsite: { $exists: false } }],
    })
      .sort({ _id: -1 })
      .populate({
        path: "parent_id",
        select: "name",
      })
      .lean();

    const resultWithAlias = itemGroups.map((item) => ({
      ...item,
      parent_name: item.parent_id ? item.parent_id.name : null,
      parent_id: item.parent_id ? item.parent_id._id : undefined,
    }));

    res.status(200).json(resultWithAlias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const axios = require('axios');
// const ItemGroup = require('../models/ItemGroup');

// exports.syncItemGroupData = async (req, res) => {
//     try {
//         const config = {
//             method: 'post',
//             maxBodyLength: Infinity,
//             url: 'https://busyapi.selectionfootwear.com/Item/GetItemGroup',
//             headers: {},
//             timeout: 5000
//         };

//         const response = await axios.request(config);
//         const { Data } = response.data;
//         // console.log("Busy API Response:", response.data);
//         console.log(JSON.stringify(response.data, null, 2));

//         if (!Data || Data.length === 0) {
//             return res.status(404).json({ message: 'No data received from Busy Item Group API' });
//         }

//         for (const {
//             ParentGroupName,
//             ParentGroupCode,
//             GroupCode,
//             GroupName,
//             AppCode,
//             Alias,
//             Discount,
//             Image,
//             IsPrimary
//         } of Data) {

//             // Step 1: Handle parent group
//             let parentGroup = await ItemGroup.findOne({
//                 is_active: true,
//                 code: ParentGroupCode
//             });

//             if (!parentGroup) {
//                 parentGroup = new ItemGroup({
//                     name: ParentGroupName,
//                     code: ParentGroupCode,
//                     alias: null,
//                     discount: null,
//                     image: null,
//                     is_primary: false,
//                     is_active: true,
//                     is_parent_group: true
//                 });
//                 parentGroup = await parentGroup.save();
//             }

//             // Step 2: Handle child group
//             if (GroupCode && GroupName) {
//                 const existingChildGroup = await ItemGroup.findOne({
//                     is_active: true,
//                     code: GroupCode
//                 });

//                 if (!existingChildGroup) {
//                     const childGroupData = new ItemGroup({
//                         parent_id: parentGroup._id,
//                         name: GroupName,
//                         code: GroupCode,
//                         alias: Alias || '',
//                         discount: Discount || 0,
//                         image: Image || '',
//                         is_primary: IsPrimary || false,
//                         is_active: true,
//                         is_parent_group: false
//                     });
//                     await childGroupData.save();
//                 }
//             }
//         }

//         res.status(200).json({
//             message: "Item groups refreshed successfully"
//         });

//     } catch (error) {
//         console.log(error);
//         if (error.code === 'ECONNABORTED') {
//             return res.status(408).json({ message: 'Request timeout - API took too long to respond' });
//         }
//         res.status(500).json({ message: error.message });
//     }
// };

exports.syncItemGroupData = async (req, res) => {
  try {
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://busyapi.selectionfootwear.com/Item/GetItemGroup",
      headers: {},
      timeout: 10000,
    };
    const response = await axios.request(config);
    const { Data } = response.data;
    if (!Array.isArray(Data) || Data.length === 0) {
      return res
        .status(404)
        .json({ message: "No data received from Busy Item Group API" });
    }
    for (const item of Data) {
      const {
        ParentGrpCode,
        ParentGrpName,
        ItemGroupCode,
        ItemGroupName,
        Image,
        Alias,
        Discount,
      } = item;

      let parent_id = null;

      // Handle Parent Group
      if (ParentGrpCode && ParentGrpCode != 0 && ParentGrpCode != "0") {
        const parentGroup = await ItemGroup.findOneAndUpdate(
          { code: String(ParentGrpCode) },
          {
            $set: {
              name: ParentGrpName,
              is_active: true,
              is_parent_group: true,
              modified_date: new Date(),
            },
            $setOnInsert: {
              is_primary: false,
              alias: null,
              discount: null,
              // image: null
            },
          },
          { upsert: true, new: true },
        );
        parent_id = parentGroup?._id;
      }

      // Handle Current Group (Child)
      if (ItemGroupCode && ItemGroupName) {
        await ItemGroup.findOneAndUpdate(
          { code: String(ItemGroupCode) },
          {
            $set: {
              name: ItemGroupName,
              parent_id: parent_id,
              is_active: true,
              is_primary: ParentGrpCode == 0 || ParentGrpCode == "0",
              modified_date: new Date(),
            },
            $setOnInsert: {
              is_parent_group: false,
              alias: Alias || null,
              discount: Discount || null,
              // image: Image || null
            },
          },
          { upsert: true },
        );
      }
    }

    res.status(200).json({
      message: "Item groups refreshed successfully",
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ECONNABORTED") {
      return res
        .status(408)
        .json({ message: "Request timeout - API took too long to respond" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
