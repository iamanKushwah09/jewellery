const mongoose = require('mongoose');
const SaleOrder = require('../models/saleorder.model');
const SaleType = require('../models/SaleType.model');
const Customer = require('../models/customer.model');
const Salesman = require('../models/Sales.model');
const Item = require('../models/item.model');
const Unit = require('../models/Unit')
const DirectCustomer = require('../models/directCustomer.model');
const axios = require("axios");
const { sendToBusyAPI } = require('../utils/busyApi');
const { createDispatchLog } = require('./dispatchLog.controller');
const dispatchlogModel = require('../models/dispatchlog.model');
const { pathToBase64 } = require('../common/folderToBase64');
const fileUploadHelper = require('../fileUploader/fileUploadHelper');
const logger = require('../utils/logger');
const { buildDateRangeQuery } = require('../middleware/dateValidation.middleware');


const generateUniqueSaleOrderVoucher = async () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    let voucherNo;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 25) {
        const random = Math.floor(1000 + Math.random() * 9000);
        voucherNo = `SO-${yyyy}${mm}${dd}-${random}`;
        const found = await SaleOrder.findOne({ voucherNo });
        if (!found) {
            exists = false;
        }
        attempts++;
    }
    return voucherNo;
};

// Create a new sale order
exports.createSaleOrder = async (req, res) => {
    try {

        const saleOrderData = { ...req.body };
        if (!saleOrderData.voucherNo || typeof saleOrderData.voucherNo !== 'string' || saleOrderData.voucherNo.trim() === '') {
            saleOrderData.voucherNo = await generateUniqueSaleOrderVoucher();
        }
        let busyPayloadJSON = {};
        if (saleOrderData?.saleType) {
            const saleType = await SaleType.findById(saleOrderData.saleType);
            if (saleType && saleType.code) {
                saleOrderData.saleTypeCode = saleType.code;
                busyPayloadJSON.SaleType = saleType.name;
            }
        }
        if (saleOrderData?.customer) {
            const customer = await Customer.findById(saleOrderData.customer);
            if (customer && customer.code) {
                saleOrderData.customerCode = customer.code;
                busyPayloadJSON.Customer = customer.name;
            }
        }
        if (saleOrderData?.salesman != "store") {
            const salesman = await Salesman.findById(saleOrderData.salesman);
            if (salesman && salesman.code) {
                saleOrderData.salesmanCode = salesman.code;
                busyPayloadJSON.Salesman = salesman.name;
            }

        } else {
            const salesman = await Salesman.findOne({ "name": "General" });
            saleOrderData.salesmanCode = salesman.code;
            saleOrderData.salesman = salesman._id;
            busyPayloadJSON.Salesman = "General"

        }

        if (saleOrderData.items && saleOrderData.items.length > 0) {
            for (let i = 0; i < saleOrderData.items.length; i++) {
                // Fix: Convert empty object {} or invalid image values to empty string for image field
                if (saleOrderData.items[i].image === null || saleOrderData.items[i].image === undefined) {
                    saleOrderData.items[i].image = '';
                } else if (typeof saleOrderData.items[i].image === 'object') {
                    // Handle empty object {} case
                    saleOrderData.items[i].image = '';
                } else if (typeof saleOrderData.items[i].image !== 'string') {
                    // Convert non-string values to string
                    saleOrderData.items[i].image = String(saleOrderData.items[i].image) || '';
                }

                if (saleOrderData.items[i].unit) {
                    const uVal = saleOrderData.items[i].unit;
                    if (typeof uVal === 'object' && uVal !== null) {
                        saleOrderData.items[i].unit = uVal.label || uVal.name || String(uVal.value || '');
                    } else if (mongoose.Types.ObjectId.isValid(uVal)) {
                        const unit = await Unit.findById(uVal);
                        if (unit && unit.name) {
                            saleOrderData.items[i].unit = unit.name;
                        }
                    } else {
                        saleOrderData.items[i].unit = String(uVal);
                    }
                }
                const item = await Item.findById(saleOrderData.items[i].itemId);
                if (item) {
                    if (!saleOrderData.items[i].listPrice || saleOrderData.items[i].listPrice == 0) {
                        saleOrderData.items[i].listPrice = item.sale_price;
                    }
                    if (saleOrderData.items[i].discount === undefined || saleOrderData.items[i].discount === null || saleOrderData.items[i].discount == 0) {
                        saleOrderData.items[i].discount = item.discount || 0;
                    }
                    if (item.conversion_factor) {
                        saleOrderData.items[i].conversion_factor = item.conversion_factor;
                    }
                }
            }
        }
        
        // Round numerical amounts to 2 decimal places to prevent floating point precision issues
        if (saleOrderData.netAmount !== undefined) saleOrderData.netAmount = Math.round(Number(saleOrderData.netAmount) * 100) / 100;
        if (saleOrderData.totalAmount !== undefined) saleOrderData.totalAmount = Math.round(Number(saleOrderData.totalAmount) * 100) / 100;
        if (saleOrderData.totalDiscountAmount !== undefined) saleOrderData.totalDiscountAmount = Math.round(Number(saleOrderData.totalDiscountAmount) * 100) / 100;

        // Sanitize sundries to ensure Name is always a valid non-empty string
        if (saleOrderData.sundries && Array.isArray(saleOrderData.sundries.SundriesDetail)) {
            saleOrderData.sundries.SundriesDetail = saleOrderData.sundries.SundriesDetail
                .map((s, index) => {
                    let name = s?.Name || s?.name;
                    if (!name || typeof name !== 'string' || name.trim() === '') {
                        if (index === 0) name = "Hammali@20/CRT";
                        else if (index === 1) name = "Discount";
                        else name = `Sundry_${index + 1}`;
                    }
                    return {
                        Name: String(name).trim(),
                        DiscountAmount: Number(s?.DiscountAmount ?? s?.discountAmount) || 0,
                        DiscountPercent: Number(s?.DiscountPercent ?? s?.discountPercent) || 0
                    };
                })
                .filter(s => s.Name !== '');
        }
        
        // const busyResponse = await sendToBusyAPI(saleOrderData, busyPayloadJSON);
        // saleOrderData.voucherNo = busyResponse.voucherNo ? busyResponse.voucherNo.trim() : null;
        const newSaleOrder = new SaleOrder(saleOrderData);
        await newSaleOrder.save();

        // Loyalty Point logic (Only awarded if active rules are configured in Loyalty Management)
        if (saleOrderData.customer) {
            try {
                const LoyaltyPoint = require('../models/loyaltyPoint.model');
                const PointsEngine = require('../services/pointsEngine.service');
                
                let pointsRedeemed = Number(req.body.redeemPoints) || 0;
                if (pointsRedeemed > 0) {
                    let loyaltyRecord = await LoyaltyPoint.findOne({ customer: saleOrderData.customer });
                    if (loyaltyRecord && loyaltyRecord.totalPoints >= pointsRedeemed) {
                        loyaltyRecord.totalPoints -= pointsRedeemed;
                        loyaltyRecord.transactions.push({
                            orderId: newSaleOrder._id.toString(),
                            pointsRedeemed: pointsRedeemed,
                            description: 'Redeemed on admin checkout'
                        });
                        await loyaltyRecord.save();
                    }
                }
                
                // Evaluate rule-based points through PointsEngine (returns 0 if no rules set)
                const loyaltyItems = (saleOrderData.items || []).map(item => ({
                    item_id: item.itemId ? (item.itemId._id || item.itemId).toString() : null,
                    price: item.price || item.listPrice || 0,
                    quantity: item.quantity || 1
                }));

                await PointsEngine.evaluate({
                    customerId: saleOrderData.customer,
                    items: loyaltyItems,
                    totalAmount: Number(saleOrderData.netAmount || saleOrderData.totalAmount || 0),
                    invoiceId: newSaleOrder._id,
                    commit: true
                });
            } catch (err) {
                console.error('Error handling loyalty points in saleorder.controller:', err);
            }
        }

        res.status(201).json({ message: "Sale Order Created" });
    } catch (err) {
        console.log("Error in creating sale Order:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get a sale order by ID
exports.getSaleOrderById = async (req, res) => {
    try {
        const saleOrder = await SaleOrder.findById(req.params.saleorderid)
            .populate('saleType', 'name')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id code')
            .populate('directCustomer')
            .populate('salesman', 'name')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .populate('convertedSaleId', 'voucherNo')
            .exec();
        if (!saleOrder) return res.status(404).json({ message: 'Sale order not found' });
        if (!saleOrder.saleVoucherNo && saleOrder.convertedSaleId?.voucherNo) {
            saleOrder.saleVoucherNo = saleOrder.convertedSaleId.voucherNo;
        }
        res.status(200).json(saleOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a sale order by ID
exports.updateSaleOrderById = async (req, res) => {
    try {
        // Check if sale order exists and has busyApiStatus as 'SUCCESS'
        const existingSaleOrder = await SaleOrder.findById(req.params.saleorderid).exec();
        if (!existingSaleOrder) {
            return res.status(404).json({ message: 'Sale order not found' });
        }

        // Prevent update if busyApiStatus is 'SUCCESS'
        if (existingSaleOrder.busyApiStatus === 'SUCCESS') {
            return res.status(403).json({
                message: 'Cannot update sale order that has been successfully processed with Busy API',
                error: 'BUSY_API_PROCESSED'
            });
        }

        const saleOrderData = { ...req.body };
        let busyPayloadJSON = {};
        if (saleOrderData.saleType) {
            const saleType = await SaleType.findById(saleOrderData.saleType);
            if (saleType && saleType.code) {
                saleOrderData.saleTypeCode = saleType.code;
                busyPayloadJSON.SaleType = saleType.name;
            }
        }
        if (saleOrderData.customer) {
            const customer = await Customer.findById(saleOrderData.customer);
            if (customer && customer.code) {
                saleOrderData.customerCode = customer.code;
                busyPayloadJSON.Customer = customer.name;
            }
        }
        if (saleOrderData.salesman) {
            const salesman = await Salesman.findById(saleOrderData.salesman);
            if (salesman && salesman.code) {
                saleOrderData.salesmanCode = salesman.code;
                busyPayloadJSON.Salesman = salesman.name;
            }
        }
        if (saleOrderData.items && saleOrderData.items.length > 0) {
            for (let i = 0; i < saleOrderData.items.length; i++) {
                // Fix: Convert empty object {} or invalid image values to empty string for image field
                if (saleOrderData.items[i].image === null || saleOrderData.items[i].image === undefined) {
                    saleOrderData.items[i].image = '';
                } else if (typeof saleOrderData.items[i].image === 'object') {
                    // Handle empty object {} case
                    saleOrderData.items[i].image = '';
                } else if (typeof saleOrderData.items[i].image !== 'string') {
                    // Convert non-string values to string
                    saleOrderData.items[i].image = String(saleOrderData.items[i].image) || '';
                }

                if (saleOrderData.items[i].unit) {
                    const uVal = saleOrderData.items[i].unit;
                    if (typeof uVal === 'object' && uVal !== null) {
                        saleOrderData.items[i].unit = uVal.label || uVal.name || String(uVal.value || '');
                    } else if (mongoose.Types.ObjectId.isValid(uVal)) {
                        const unit = await Unit.findById(uVal);
                        if (unit && unit.name) {
                            saleOrderData.items[i].unit = unit.name;
                        }
                    } else {
                        saleOrderData.items[i].unit = String(uVal);
                    }
                }
                const item = await Item.findById(saleOrderData.items[i].itemId);
                if (item) {
                    if (!saleOrderData.items[i].listPrice || saleOrderData.items[i].listPrice == 0) {
                        saleOrderData.items[i].listPrice = item.sale_price;
                    }
                    if (saleOrderData.items[i].discount === undefined || saleOrderData.items[i].discount === null || saleOrderData.items[i].discount == 0) {
                        saleOrderData.items[i].discount = item.discount || 0;
                    }
                    if (item.conversion_factor) {
                        saleOrderData.items[i].conversion_factor = item.conversion_factor;
                    }
                }
            }
        }

        // Round numerical amounts to 2 decimal places to prevent floating point precision issues
        if (saleOrderData.netAmount !== undefined) saleOrderData.netAmount = Math.round(Number(saleOrderData.netAmount) * 100) / 100;
        if (saleOrderData.totalAmount !== undefined) saleOrderData.totalAmount = Math.round(Number(saleOrderData.totalAmount) * 100) / 100;
        // Sanitize sundries to ensure Name is always a valid non-empty string
        if (saleOrderData.sundries && Array.isArray(saleOrderData.sundries.SundriesDetail)) {
            saleOrderData.sundries.SundriesDetail = saleOrderData.sundries.SundriesDetail
                .map((s, index) => {
                    let name = s?.Name || s?.name;
                    if (!name || typeof name !== 'string' || name.trim() === '') {
                        if (index === 0) name = "Hammali@20/CRT";
                        else if (index === 1) name = "Discount";
                        else name = `Sundry_${index + 1}`;
                    }
                    return {
                        Name: String(name).trim(),
                        DiscountAmount: Number(s?.DiscountAmount ?? s?.discountAmount) || 0,
                        DiscountPercent: Number(s?.DiscountPercent ?? s?.discountPercent) || 0
                    };
                })
                .filter(s => s.Name !== '');
        }

        const updatedSaleOrder = await SaleOrder.findByIdAndUpdate(
            req.params.saleorderid,
            saleOrderData,
            { new: true }
        ).exec();
        if (!updatedSaleOrder) return res.status(404).json({ message: 'Sale order not found' });
        res.status(201).json({ message: "Sale Order Updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a sale order by ID
exports.deleteSaleOrderById = async (req, res) => {
    try {
        // Check if sale order exists and has busyApiStatus as 'SUCCESS'
        const existingSaleOrder = await SaleOrder.findById(req.params.saleorderid).exec();
        if (!existingSaleOrder) {
            return res.status(404).json({ message: 'Sale order not found' });
        }

        // Prevent deletion if busyApiStatus is 'SUCCESS'
        if (existingSaleOrder.busyApiStatus === 'SUCCESS') {
            return res.status(403).json({
                message: 'Cannot delete sale order that has been successfully processed with Busy API',
                error: 'BUSY_API_PROCESSED'
            });
        }

        const deletedSaleOrder = await SaleOrder.findByIdAndDelete(req.params.saleorderid).exec();
        if (!deletedSaleOrder) return res.status(404).json({ message: 'Sale order not found' });
        res.status(200).json({ message: 'Sale Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSaleOrder = async (req, res) => {
    try {
        let query = {};
        if (req.user?.salesman_id) {
            query.salesman = req.user.salesman_id;
        }

        // Support Search across voucherNo, customer, directCustomer, salesman, and saleType
        const searchQuery = req.query.search || req.query.q;
        if (searchQuery && searchQuery.trim() !== '') {
            const searchTerm = searchQuery.trim();

            const [matchingDirectCustomers, matchingCustomers, matchingSalesmen, matchingSaleTypes] = await Promise.all([
                DirectCustomer.find({
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { mobile: { $regex: searchTerm, $options: 'i' } }
                    ]
                }).select('_id').lean(),
                Customer.find({
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { mobile: { $regex: searchTerm, $options: 'i' } },
                        { gst_no: { $regex: searchTerm, $options: 'i' } }
                    ]
                }).select('_id').lean(),
                Salesman.find({
                    name: { $regex: searchTerm, $options: 'i' }
                }).select('_id').lean(),
                SaleType.find({
                    name: { $regex: searchTerm, $options: 'i' }
                }).select('_id').lean()
            ]);

            const directCustomerIds = matchingDirectCustomers.map(dc => dc._id);
            const customerIds = matchingCustomers.map(c => c._id);
            const salesmanIds = matchingSalesmen.map(s => s._id);
            const saleTypeIds = matchingSaleTypes.map(st => st._id);

            query.$or = [
                { voucherNo: { $regex: searchTerm, $options: 'i' } },
                { customer: { $in: customerIds } },
                { directCustomer: { $in: directCustomerIds } },
                { salesman: { $in: salesmanIds } },
                { saleType: { $in: saleTypeIds } }
            ];
        }

        // Support Date Range filtering
        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }

            if (Object.keys(dateFilter).length > 0) {
                query.$and = query.$and || [];
                query.$and.push({
                    $or: [
                        { date: dateFilter },
                        { createdAt: dateFilter }
                    ]
                });
            }
        }

        // Check if pagination is requested
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined || req.query.paginated === 'true';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit)) : 20;
        const skip = (page - 1) * limit;

        let queryBuilder = SaleOrder.find(query)
            .select('-items') // Exclude heavy items array on table list for blazing fast speed
            .populate('saleType', 'name')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id remarks')
            .populate('directCustomer')
            .populate('salesman', 'name')
            .populate('convertedSaleId', 'voucherNo')
            .sort({ createdAt: -1 })
            .lean();

        if (hasPagination) {
            queryBuilder = queryBuilder.skip(skip).limit(limit);
        }

        const [totalOrders, saleOrders] = await Promise.all([
            SaleOrder.countDocuments(query),
            queryBuilder.exec()
        ]);

        for (const order of (saleOrders || [])) {
            if (!order.saleVoucherNo && order.convertedSaleId?.voucherNo) {
                order.saleVoucherNo = order.convertedSaleId.voucherNo;
            }
        }

        // If pagination is requested, return structured object
        if (hasPagination) {
            return res.status(200).json({
                success: true,
                orders: saleOrders,
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                limit
            });
        }

        // Legacy format fallback (array directly)
        res.status(200).json(saleOrders);
    } catch (err) {
        console.error("Error in getSaleOrder:", err);
        res.status(500).json({ message: err.message });
    }
};

// Search sale orders by text query
exports.searchSaleOrders = async (req, res) => {
    try {
        const searchQuery = req.query.q || req.query.search || '';

        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
                timestamp: new Date().toISOString()
            });
        }

        const searchTerm = searchQuery.trim();

        // Build search query - search across multiple fields
        // 1. First, search for direct customers if they match the searchTerm
        const matchingDirectCustomers = await DirectCustomer.find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { mobile: { $regex: searchTerm, $options: 'i' } }
            ]
        }).select('_id');

        const directCustomerIds = matchingDirectCustomers.map(dc => dc._id);

        const searchConditions = {
            $or: [
                { voucherNo: { $regex: searchTerm, $options: 'i' } },
                { 'customer.name': { $regex: searchTerm, $options: 'i' } },
                { 'customer.email': { $regex: searchTerm, $options: 'i' } },
                { 'customer.mobile': { $regex: searchTerm, $options: 'i' } },
                { 'customer.gst_no': { $regex: searchTerm, $options: 'i' } },
                { 'salesman.name': { $regex: searchTerm, $options: 'i' } },
                { 'saleType.name': { $regex: searchTerm, $options: 'i' } },
                { directCustomer: { $in: directCustomerIds } }
            ],
            isActive: true
        };

        if (req.user?.salesman_id) {
            searchConditions.salesman = req.user.salesman_id;
        }

        const saleOrders = await SaleOrder.find(searchConditions)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .populate('convertedSaleId', 'voucherNo')
            .sort({ date: -1, createdAt: -1 })
            .limit(100) // Limit results for performance
            .lean()
            .exec();

        for (const order of (saleOrders || [])) {
            if (!order.saleVoucherNo && order.convertedSaleId?.voucherNo) {
                order.saleVoucherNo = order.convertedSaleId.voucherNo;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                orders: saleOrders,
                count: saleOrders.length,
                searchQuery: searchTerm
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in searchSaleOrders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while searching sale orders',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Get sale orders with comprehensive filtering
exports.getSaleOrdersByDateRange = async (req, res) => {
    const startTime = Date.now();
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {


        // Extract pagination parameters with defaults
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // Default 20 items per page
        const skip = (page - 1) * limit;

        // Build base query
        let query = { isActive: true };

        // Add date range filter if validated dates are available
        if (req.validatedDates) {
            const dateRangeQuery = buildDateRangeQuery(req.validatedDates);
            query = { ...query, ...dateRangeQuery };
            logger.info(`[${requestId}] Date range filter applied`, {
                dateQuery: dateRangeQuery,
                startDate: req.validatedDates.startDate?.toISOString(),
                endDate: req.validatedDates.endDate?.toISOString()
            });
        }

        // Add status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Add customer filter (handle both ObjectId and name search)
        if (req.query.customer) {
            // If it looks like an ObjectId, use direct match
            if (req.query.customer.match(/^[0-9a-fA-F]{24}$/)) {
                query.customer = req.query.customer;
            } else {
                // If it's a name, search in customer name field
                query['customer.name'] = { $regex: req.query.customer, $options: 'i' };
            }
        }

        // Add salesman filter (handle both ObjectId and name search)
        const effectiveSalesmanId = req.query.salesman || req.user?.salesman_id;
        if (effectiveSalesmanId) {
            if (String(effectiveSalesmanId).match(/^[0-9a-fA-F]{24}$/)) {
                query.salesman = effectiveSalesmanId;
            } else {
                query['salesman.name'] = { $regex: effectiveSalesmanId, $options: 'i' };
            }
        }

        // Add amount range filters
        if (req.query.minAmount || req.query.maxAmount) {
            query.totalAmount = {};
            if (req.query.minAmount) {
                query.totalAmount.$gte = parseFloat(req.query.minAmount);
            }
            if (req.query.maxAmount) {
                query.totalAmount.$lte = parseFloat(req.query.maxAmount);
            }
        }

        // Add search functionality (search in multiple fields)
        if (req.query.search) {
            const searchTerm = req.query.search.trim();

            // 1. First, search for direct customers if they match the searchTerm
            const matchingDirectCustomers = await DirectCustomer.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile: { $regex: searchTerm, $options: 'i' } }
                ]
            }).select('_id');

            const directCustomerIds = matchingDirectCustomers.map(dc => dc._id);

            query.$or = [
                { voucherNo: { $regex: searchTerm, $options: 'i' } },
                { 'customer.name': { $regex: searchTerm, $options: 'i' } },
                { 'customer.email': { $regex: searchTerm, $options: 'i' } },
                { 'customer.mobile': { $regex: searchTerm, $options: 'i' } },
                { 'customer.gst_no': { $regex: searchTerm, $options: 'i' } },
                { 'salesman.name': { $regex: searchTerm, $options: 'i' } },
                { 'saleType.name': { $regex: searchTerm, $options: 'i' } },
                { directCustomer: { $in: directCustomerIds } }
            ];
        }

        logger.info(`[${requestId}] Built query`, { query });

        // Execute query with pagination
        const [saleOrders, totalCount] = await Promise.all([
            SaleOrder.find(query)
                .populate('saleType', 'name code')
                .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id')
                .populate('directCustomer')
                .populate('salesman', 'name code')
                .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
                .populate('convertedSaleId', 'voucherNo')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            SaleOrder.countDocuments(query)
        ]);

        for (const order of (saleOrders || [])) {
            if (!order.saleVoucherNo && order.convertedSaleId?.voucherNo) {
                order.saleVoucherNo = order.convertedSaleId.voucherNo;
            }
        }

        // Calculate summary statistics for the filtered results
        const summaryStats = await SaleOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    totalQuantity: { $sum: '$totalQuantity' },
                    avgOrderValue: { $avg: '$totalAmount' },
                    minOrderValue: { $min: '$totalAmount' },
                    maxOrderValue: { $max: '$totalAmount' }
                }
            }
        ]);

        // Get status breakdown
        const statusBreakdown = await SaleOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Performance metrics
        const processingTime = Date.now() - startTime;

        // Define additional filters for response metadata
        const additionalFilters = ['status', 'customer', 'salesman', 'search', 'minAmount', 'maxAmount'];

        const responseData = {
            success: true,
            data: {
                orders: saleOrders,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNext,
                    hasPrev,
                    nextPage: hasNext ? page + 1 : null,
                    prevPage: hasPrev ? page - 1 : null
                },
                summary: summaryStats[0] || {
                    totalOrders: 0,
                    totalAmount: 0,
                    totalQuantity: 0,
                    avgOrderValue: 0,
                    minOrderValue: 0,
                    maxOrderValue: 0
                },
                statusBreakdown: statusBreakdown.map(item => ({
                    status: item._id,
                    count: item.count,
                    totalAmount: item.totalAmount,
                    percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(2) : '0.00'
                }))
            },
            performance: {
                processingTimeMs: processingTime,
                databaseQueryTime: processingTime // Simplified for this example
            },
            filters: {
                appliedDateRange: req.validatedDates ? {
                    startDate: req.validatedDates.startDate?.toISOString(),
                    endDate: req.validatedDates.endDate?.toISOString()
                } : null,
                additionalFilters: additionalFilters.reduce((acc, filter) => {
                    if (req.query[filter]) acc[filter] = req.query[filter];
                    return acc;
                }, {})
            },
            timestamp: new Date().toISOString(),
            requestId
        };

        logger.info(`[${requestId}] Sale order date range query completed successfully`, {
            totalOrders: totalCount,
            returnedOrders: saleOrders.length,
            page,
            limit,
            processingTime,
            hasFilters: Object.keys(responseData.filters.appliedDateRange || {}).length > 0 ||
                Object.keys(responseData.filters.additionalFilters).length > 0
        });

        res.status(200).json(responseData);

    } catch (error) {
        const processingTime = Date.now() - startTime;

        logger.error(`[${requestId}] Error in getSaleOrdersByDateRange`, {
            error: error.message,
            stack: error.stack,
            query: req.query,
            processingTime,
            errorType: error.name
        });

        // Handle specific error types
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_PARAMETER',
                message: 'Invalid parameter format provided',
                details: `Invalid value for parameter: ${error.path}`,
                timestamp: new Date().toISOString(),
                requestId
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Database validation error',
                details: Object.values(error.errors).map(err => err.message),
                timestamp: new Date().toISOString(),
                requestId
            });
        }

        // Generic server error
        return res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'An error occurred while querying sale orders',
            timestamp: new Date().toISOString(),
            requestId,
            ...(process.env.NODE_ENV === 'development' && {
                errorDetails: error.message,
                stack: error.stack
            })
        });
    }
};

// Get sale orders by customer ID with aggregated data
exports.getSaleOrdersByCustomer = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const saleOrders = await SaleOrder.find({ customer: customerId })
            .populate('saleType', 'name')
            .populate('customer', 'name')
            .populate('directCustomer')
            .populate('salesman', 'name')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .sort({ createdAt: -1 })
            .exec();
        // Calculate aggregated data
        const totalOrders = saleOrders.length;
        const totalAmount = saleOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const startOrders = saleOrders.filter(order => order.status === 'Start').length;
        const processingOrders = saleOrders.filter(order => order.status === 'Processing').length;
        const deliveredOrders = saleOrders.filter(order => order.status === 'Delivered').length;
        // Get recent 5 orders
        const recentOrders = saleOrders.slice(0, 5);
        const aggregatedData = {
            totalOrders,
            totalAmount,
            startOrders,
            processingOrders,
            deliveredOrders,
            recentOrders,
            orders: saleOrders
        };
        res.status(200).json(aggregatedData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get order history by customer ID (paginated)
exports.getOrderHistoryByCustomer = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const totalOrders = await SaleOrder.countDocuments({ customer: customerId });
        const saleOrders = await SaleOrder.find({ customer: customerId })
            .populate('saleType', 'name')
            .populate('customer', 'name')
            .populate('directCustomer')
            .populate('salesman', 'name')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalPages = Math.ceil(totalOrders / limit);
        res.status(200).json({
            orders: saleOrders,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.dispatchUpdate = async (req, res) => {
    try {
        const { saleorderid } = req.params;
        const saleOrderData = req.body; // ✅ assuming the update data comes from request body
        // console.log(saleOrderData,'saleOrderData')
        // Check if ID exists
        if (!saleorderid) {
            return res.status(400).json({
                success: false,
                message: "Sale Order ID is required",
            });
        }

        // Check if sale order exists and has busyApiStatus as 'SUCCESS'
        const existingSaleOrder = await SaleOrder.findById(saleorderid).exec();
        if (!existingSaleOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sale order not found'
            });
        }

        // Prevent update if busyApiStatus is 'SUCCESS'
        if (existingSaleOrder.busyApiStatus === 'SUCCESS') {
            return res.status(403).json({
                success: false,
                message: 'Cannot update sale order that has been successfully processed with Busy API',
                error: 'BUSY_API_PROCESSED'
            });
        }

        const { images, ...saleOrderdata } = saleOrderData;

        // Fix: Convert empty object {} or invalid image values to empty string for image field in items
        if (saleOrderdata.items && saleOrderdata.items.length > 0) {
            for (let i = 0; i < saleOrderdata.items.length; i++) {
                if (saleOrderdata.items[i].image === null || saleOrderdata.items[i].image === undefined) {
                    saleOrderdata.items[i].image = '';
                } else if (typeof saleOrderdata.items[i].image === 'object') {
                    // Handle empty object {} case
                    saleOrderdata.items[i].image = '';
                } else if (typeof saleOrderdata.items[i].image !== 'string') {
                    // Convert non-string values to string
                    saleOrderdata.items[i].image = String(saleOrderdata.items[i].image) || '';
                }
            }
        }

        // Perform update
        const updatedSaleOrder = await SaleOrder.findByIdAndUpdate(saleorderid, saleOrderdata, { new: true, runValidators: true }).exec();
        let dispatches = [];
        if (Array.isArray(images) && images.length > 0) {
            dispatches = await Promise.all(
                images
                    .filter((image) => image.base64File && image.fileName)
                    .map(async (image) => {
                        const { base64File, fileName } = image;
                        const cleanedBase64File = base64File.split(';base64,').pop();
                        return await fileUploadHelper.uploadSingleFile(`dispatch/${saleorderid}`, fileName.replace(/\s+/g, ''), cleanedBase64File);
                    })
            );
        }

        await dispatchlogModel.create({ "status": saleOrderData.status, "orderDetails_id": saleorderid, "updateDescription": saleOrderData.description, "grNo": saleOrderData.grNo, "lot": saleOrderData.lotNo, "images": dispatches });
        // If no document found
        if (!updatedSaleOrder) {
            return res.status(404).json({
                success: false,
                message: "Sale Order not found",
            });
        }
        // ✅ Success Response
        return res.status(200).json({
            success: true,
            message: "Sale Order updated successfully",
            data: updatedSaleOrder,
        });

    } catch (error) {
        console.error("❌ Error updating sale order:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error while updating sale order",
            error: error.message,
        });
    }
};

let dashboardCache = {
    data: null,
    salesmanId: null,
    timestamp: 0
};

// Get dashboard data for admin (High-performance optimized aggregation)
exports.getDashboardData = async (req, res) => {
    try {
        const salesmanKey = req.user?.salesman_id ? String(req.user.salesman_id) : 'admin';
        const nowMs = Date.now();
        // Fast in-memory cache (15 seconds TTL) to avoid running 6 heavy aggregations repeatedly
        if (dashboardCache.data && dashboardCache.salesmanId === salesmanKey && (nowMs - dashboardCache.timestamp < 15000)) {
            return res.status(200).json(dashboardCache.data);
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const sevenDaysAgoStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        let matchQuery = {};
        if (req.user?.salesman_id) {
            matchQuery.salesman = mongoose.Types.ObjectId.isValid(req.user.salesman_id)
                ? new mongoose.Types.ObjectId(req.user.salesman_id)
                : req.user.salesman_id;
        }

        // Run aggregations and queries in parallel on the database engine
        const [salesSummary, statusCounts, topProducts, recentOrders, weeklyAgg, monthlyAgg] = await Promise.all([
            // 1. Sales metrics calculated in a single aggregation pass
            SaleOrder.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        allTime: { $sum: '$totalAmount' },
                        today: {
                            $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$totalAmount', 0] }
                        },
                        yesterday: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $gte: ['$createdAt', yesterday] }, { $lt: ['$createdAt', today] }] },
                                    '$totalAmount',
                                    0
                                ]
                            }
                        },
                        thisMonth: {
                            $sum: { $cond: [{ $gte: ['$createdAt', thisMonth] }, '$totalAmount', 0] }
                        },
                        lastMonth: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $gte: ['$createdAt', lastMonth] }, { $lt: ['$createdAt', thisMonth] }] },
                                    '$totalAmount',
                                    0
                                ]
                            }
                        },
                        weekly: {
                            $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, '$totalAmount', 0] }
                        }
                    }
                }
            ]),

            // 2. Status counts
            SaleOrder.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // 3. Best selling products (top 10)
            SaleOrder.aggregate([
                { $match: matchQuery },
                { $project: { items: 1 } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.itemId',
                        name: { $first: '$items.name' },
                        totalQuantity: { $sum: '$items.quantity' },
                        totalAmount: { $sum: '$items.amount' }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]),

            // 4. Recent orders (only 5 items, selective fields, lean)
            SaleOrder.find(matchQuery)
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id voucherNo customer totalAmount status createdAt')
                .lean(),

            // 5. Weekly trend aggregation (last 7 days)
            SaleOrder.aggregate([
                { $match: { ...matchQuery, createdAt: { $gte: sevenDaysAgoStart } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        sales: { $sum: '$totalAmount' },
                        orders: { $sum: 1 }
                    }
                }
            ]),

            // 6. Monthly trend aggregation (last 6 months)
            SaleOrder.aggregate([
                { $match: { ...matchQuery, createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        sales: { $sum: '$totalAmount' },
                        orders: { $sum: 1 }
                    }
                }
            ])
        ]);

        const sales = salesSummary[0] || {
            totalOrders: 0,
            allTime: 0,
            today: 0,
            yesterday: 0,
            thisMonth: 0,
            lastMonth: 0,
            weekly: 0
        };

        // Status breakdown
        const statusMap = {};
        statusCounts.forEach(s => { statusMap[s._id] = s.count; });
        const ordersPending = statusMap['Start'] || 0;
        const ordersProcessing = statusMap['Processing'] || 0;
        const ordersDelivered = statusMap['Delivered'] || 0;
        const ordersCancelled = statusMap['Cancelled'] || 0;

        const orderStatusBreakdown = [
            { label: 'Delivered', count: ordersDelivered, color: '#26bf94' },
            { label: 'Processing', count: ordersProcessing, color: '#845adf' },
            { label: 'Pending', count: ordersPending, color: '#f5b849' },
            { label: 'Cancelled', count: ordersCancelled, color: '#e6533c' }
        ];

        // 7-day sales & orders trend
        const weeklyMap = {};
        weeklyAgg.forEach(w => {
            weeklyMap[w._id] = { sales: w.sales || 0, orders: w.orders || 0 };
        });

        const weeklySalesTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const key = `${yyyy}-${mm}-${dd}`;
            const stats = weeklyMap[key] || { sales: 0, orders: 0 };
            weeklySalesTrend.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: Math.round(stats.sales),
                orders: stats.orders
            });
        }

        // 6-month sales & orders trend
        const monthlyMap = {};
        monthlyAgg.forEach(m => {
            monthlyMap[m._id] = { sales: m.sales || 0, orders: m.orders || 0 };
        });

        const monthlySalesTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            const stats = monthlyMap[key] || { sales: 0, orders: 0 };
            monthlySalesTrend.push({
                month: d.toLocaleDateString('en-US', { month: 'short' }),
                year: d.getFullYear(),
                sales: Math.round(stats.sales),
                orders: stats.orders
            });
        }

        const bestSellingProducts = topProducts.map(product => ({
            itemId: product._id,
            name: product.name,
            totalQuantity: product.totalQuantity,
            totalAmount: product.totalAmount
        }));

        const dashboardData = {
            totalOrders: sales.totalOrders,
            ordersPending,
            ordersProcessing,
            ordersDelivered,
            ordersCancelled,
            orderStatusBreakdown,
            sales: {
                today: sales.today,
                yesterday: sales.yesterday,
                thisMonth: sales.thisMonth,
                lastMonth: sales.lastMonth,
                allTime: sales.allTime,
                weekly: sales.weekly
            },
            weeklySalesTrend,
            monthlySalesTrend,
            bestSellingProducts,
            recentOrders
        };

        // Cache response for next requests
        dashboardCache = {
            data: dashboardData,
            salesmanId: salesmanKey,
            timestamp: nowMs
        };

        res.status(200).json(dashboardData);
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({ message: err.message });
    }
};



// Robust sale order processing endpoint
exports.processSaleOrder = async (req, res) => {
    try {
        // Extract and validate request parameters
        const { saleorderid } = req.params;
        const { forceReprocess } = req.query;

        // Validate required parameters
        if (!saleorderid) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETER',
                message: 'Sale order ID is required',
                timestamp: new Date().toISOString()
            });
        }

        // Validate MongoDB ObjectId format
        if (!saleorderid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_ID_FORMAT',
                message: 'Invalid sale order ID format',
                timestamp: new Date().toISOString()
            });
        }

        // Step 1: Retrieve sale order by unique identifier
        // console.log(`Processing sale order: ${saleorderid}`);

        const saleOrder = await SaleOrder.findById(saleorderid)
            .populate('saleType', 'name code')
            .populate('customer', 'name code email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest shippingAddress _id')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor')
            .exec();




        // Check if sale order exists
        if (!saleOrder) {
            return res.status(404).json({
                success: false,
                error: 'SALE_ORDER_NOT_FOUND',
                message: 'Sale order not found',
                timestamp: new Date().toISOString()
            });
        }

        // console.log(saleOrder, 'saleOrder')
        // Step 2: Data validation and transformation
        // const validationResult = validateSaleOrderData(saleOrder);
        // if (!validationResult.isValid) {
        //     return res.status(422).json({
        //         success: false,
        //         error: 'VALIDATION_FAILED',
        //         message: 'Sale order data validation failed',
        //         validationErrors: validationResult.errors,
        //         timestamp: new Date().toISOString()
        //     });
        // }
        // Step 3: Check if already processed and force reprocess flag
        // if (saleOrder.voucherNo && !forceReprocess) {
        //     return res.status(200).json({
        //         success: true,
        //         message: 'Sale order already processed',
        //         data: {
        //             saleOrderId: saleOrder._id,
        //             voucherNo: saleOrder.voucherNo,
        //             status: 'ALREADY_PROCESSED',
        //             processedAt: saleOrder.updatedAt
        //         },
        //         timestamp: new Date().toISOString()
        //     });
        // }

        // Step 4: Transform data for Busy API
        // console.log('Transforming sale order data for Busy API integration');

        const { transformedData, busyPayloadJSON } = await transformDataForBusyAPI(saleOrder);
        // Step 5: Send processed data to Busy API integration service
        const busyApiResult = await sendToBusyAPI(transformedData, busyPayloadJSON);
        if (!busyApiResult.success) {
            return res.status(400).json({
                status: false,
                error: 'BUSY_API_ERROR',
                message: busyApiResult?.error?.ErrorMessage,
            });
        }

        // Step 6: Handle Busy API response and update sale order
        let updateData = {
            updatedAt: new Date()
        };

        // let processingResult = {
        //     saleOrderId: saleOrder._id,
        //     voucherNo: saleOrder.voucherNo,
        //     busyApiResponse: busyApiResult,
        //     processedAt: new Date()
        // };
        // if (busyApiResult.success && busyApiResult.voucherNo) {
        //     // Successful processing
        //     updateData.voucherNo = busyApiResult.voucherNo.trim();
        //     updateData.busyApiStatus = 'SUCCESS';
        //     updateData.lastProcessedAt = new Date();
        //     processingResult.status = 'PROCESSED_SUCCESSFULLY';
        //     processingResult.voucherNo = updateData.voucherNo;
        //     console.log(`Sale order ${saleorderid} processed successfully with voucher: ${updateData.voucherNo}`);
        // } else {
        //     // Failed processing
        //     updateData.busyApiStatus = 'FAILED';
        //     updateData.busyApiError = busyApiResult.error || 'Unknown error';
        //     updateData.lastFailedAt = new Date();
        //     processingResult.status = 'PROCESSING_FAILED';
        //     processingResult.error = busyApiResult.error;

        //     console.error(`Sale order ${saleorderid} processing failed:`, busyApiResult.error);
        // }



        // Step 7: Update sale order with processing results
        if (busyApiResult.voucherNo) {
            const updatedSaleOrder = await SaleOrder.findByIdAndUpdate(
                saleorderid,
                { ...(busyApiResult?.voucherNo && { voucherNo: busyApiResult.voucherNo }), "busyApiStatus": busyApiResult.voucherNo && busyApiResult.success ? 'SUCCESS' : 'FAILED' },
                { new: true, runValidators: true }
            ).exec();

            // Also keep any linked Sale invoices in sync with the Busy voucher number
            try {
                const Sale = require('../models/sale.model');
                await Sale.updateMany(
                    { $or: [{ saleOrder: saleorderid }, { saleOrders: saleorderid }] },
                    { saleOrderVoucherNo: busyApiResult.voucherNo }
                );
            } catch (syncSaleErr) {
                console.error("Error updating linked sale vouchers after busy post:", syncSaleErr);
            }
        }



        // Step 8: Return appropriate response
        // if (busyApiResult.success) {
        return res.status(200).json({
            status: true,
            message: 'Sale order processed successfully',
            // data: processingResult,
            // saleOrder: updatedSaleOrder,
            // timestamp: new Date().toISOString()
        });
        // } else {
        //     return res.status(502).json({
        //         success: false,
        //         error: 'BUSY_API_PROCESSING_FAILED',
        //         message: 'Failed to process sale order with Busy API',
        //         // data: processingResult,
        //         timestamp: new Date().toISOString()
        //     });
        // }

    } catch (error) {
        // Comprehensive error handling
        console.error('Error in processSaleOrder:', error);

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(422).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Database validation error',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_ID',
                message: 'Invalid sale order ID format',
                timestamp: new Date().toISOString()
            });
        }

        // Generic server error
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred while processing the sale order',
            timestamp: new Date().toISOString()
        });
    }
};

// Data validation function
const validateSaleOrderData = (saleOrder) => {
    const errors = [];

    // Required fields validation
    if (!saleOrder.saleType) {
        errors.push('Sale type is required');
    }

    if (!saleOrder.customer) {
        errors.push('Customer is required');
    }

    if (!saleOrder.salesman) {
        errors.push('Salesman is required');
    }

    if (!saleOrder.items || !Array.isArray(saleOrder.items) || saleOrder.items.length === 0) {
        errors.push('At least one item is required');
    }

    // Items validation
    if (saleOrder.items && saleOrder.items.length > 0) {
        saleOrder.items.forEach((item, index) => {
            if (!item.itemId) {
                errors.push(`Item ${index + 1}: itemId is required`);
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: valid quantity is required`);
            }
            if (!item.price || item.price < 0) {
                errors.push(`Item ${index + 1}: valid price is required`);
            }
        });
    }

    // Numeric validations
    if (saleOrder.totalAmount !== undefined && saleOrder.totalAmount < 0) {
        errors.push('Total amount cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Data transformation function
const transformDataForBusyAPI = async (saleOrder) => {
    const busyPayloadJSON = {};
    const transformedData = { ...saleOrder.toObject() };

    try {
        // Transform sale type
        if (saleOrder.saleType && saleOrder.saleType.name) {
            busyPayloadJSON.SaleType = saleOrder.saleType.name;
        }

        // Transform customer
        if (saleOrder.customer && saleOrder.customer.name) {
            busyPayloadJSON.Customer = saleOrder.customer.name;
        }

        // Transform salesman
        if (saleOrder.salesman && saleOrder.salesman.name) {
            busyPayloadJSON.Salesman = saleOrder.salesman.name;
        }

        // Transform items - ensure all required fields are present
        if (transformedData.items && transformedData.items.length > 0) {
            transformedData.items = transformedData.items.map(item => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0,
                discount: Number(item.discount) || 0,
                totalDiscount: Number(item.totalDiscount) || 0,
                amount: Number(item.amount) || 0,
                conversion_factor: item.conversion_factor || 1
            }));
        }

        // Ensure numeric fields are properly typed
        transformedData.totalAmount = Number(transformedData.totalAmount) || 0;
        transformedData.netAmount = Number(transformedData.netAmount) || 0;
        transformedData.totalDiscountAmount = Number(transformedData.totalDiscountAmount) || 0;
        transformedData.totalQuantity = Number(transformedData.totalQuantity) || 0;

        // Ensure date is properly formatted
        if (transformedData.date) {
            transformedData.date = new Date(transformedData.date);
        }

    } catch (error) {
        console.error('Error transforming data for Busy API:', error);
        throw new Error('Data transformation failed: ' + error.message);
    }

    return {
        transformedData,
        busyPayloadJSON
    };
};
