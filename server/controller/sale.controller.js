const Sale = require('../models/sale.model');
const SaleType = require('../models/SaleType.model');
const Customer = require('../models/customer.model');
const Salesman = require('../models/Sales.model');
const Item = require('../models/item.model');
const Unit = require('../models/Unit');
const DirectCustomer = require('../models/directCustomer.model');
const LoyaltyLedger = require('../models/loyaltyLedger.model');
const LoyaltyPoint = require('../models/loyaltyPoint.model');
const PointsEngine = require('../services/pointsEngine.service');
const CouponGiftEngine = require('../services/couponGiftEngine.service');

// Create a new Sale invoice
exports.createSale = async (req, res) => {
    try {
        const saleData = { ...req.body };

        if (saleData?.saleType) {
            const saleType = await SaleType.findById(saleData.saleType);
            if (saleType && saleType.code) {
                saleData.saleTypeCode = saleType.code;
            }
        }
        if (saleData?.customer) {
            const customer = await Customer.findById(saleData.customer);
            if (customer && customer.code) {
                saleData.customerCode = customer.code;
            }
        }
        if (saleData?.salesman && saleData.salesman !== "store") {
            const salesman = await Salesman.findById(saleData.salesman);
            if (salesman && salesman.code) {
                saleData.salesmanCode = salesman.code;
            }
        } else {
            const salesman = await Salesman.findOne({ name: "General" });
            if (salesman) {
                saleData.salesmanCode = salesman.code;
                saleData.salesman = salesman._id;
            }
        }

        if (saleData.items && saleData.items.length > 0) {
            for (let i = 0; i < saleData.items.length; i++) {
                if (!saleData.items[i].image || typeof saleData.items[i].image === 'object') {
                    saleData.items[i].image = '';
                } else {
                    saleData.items[i].image = String(saleData.items[i].image);
                }

                if (saleData.items[i].unit) {
                    const unit = await Unit.findById(saleData.items[i].unit);
                    if (unit && unit.name) {
                        saleData.items[i].unit = unit.name;
                    }
                }
                const item = await Item.findById(saleData.items[i].itemId);
                if (item) {
                    if (!saleData.items[i].listPrice || saleData.items[i].listPrice === 0) {
                        saleData.items[i].listPrice = item.sale_price;
                    }
                    if (saleData.items[i].discount === undefined || saleData.items[i].discount === null) {
                        saleData.items[i].discount = item.discount || 0;
                    }
                    if (item.conversion_factor) {
                        saleData.items[i].conversion_factor = item.conversion_factor;
                    }
                }
            }
        }

        // Round numerical amounts to 2 decimals
        if (saleData.netAmount !== undefined) saleData.netAmount = Math.round(Number(saleData.netAmount) * 100) / 100;
        if (saleData.totalAmount !== undefined) saleData.totalAmount = Math.round(Number(saleData.totalAmount) * 100) / 100;
        if (saleData.totalDiscountAmount !== undefined) saleData.totalDiscountAmount = Math.round(Number(saleData.totalDiscountAmount) * 100) / 100;

        const newSale = new Sale(saleData);
        await newSale.save();

        // Process Loyalty Points (Redemption & Earning)
        if (saleData.customer) {
            try {
                const customerId = saleData.customer;
                const pointsRedeemed = Number(saleData.loyaltyPointsRedeemed) || 0;

                // 1. Process Redemption: Deduct points from LoyaltyLedger (FIFO) & LoyaltyPoint
                if (pointsRedeemed > 0) {
                    const now = new Date();
                    const ledgerEntries = await LoyaltyLedger.find({
                        customerId,
                        isExpired: false,
                        $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
                    }).sort({ earnedDate: 1 });

                    let remaining = pointsRedeemed;
                    for (const entry of ledgerEntries) {
                        if (remaining <= 0) break;
                        const available = (entry.pointsEarned || 0) - (entry.pointsRedeemed || 0);
                        if (available > 0) {
                            const deduct = Math.min(available, remaining);
                            entry.pointsRedeemed = (entry.pointsRedeemed || 0) + deduct;
                            remaining -= deduct;
                            await entry.save();
                        }
                    }

                    // Also create a redemption entry in ledger for tracking
                    await LoyaltyLedger.create({
                        customerId,
                        sourceType: 'redemption',
                        sourceRefId: newSale._id,
                        pointsEarned: 0,
                        pointsRedeemed: pointsRedeemed,
                        earnedDate: new Date()
                    });

                    // Update legacy LoyaltyPoint model
                    let loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId });
                    if (loyaltyRecord) {
                        loyaltyRecord.totalPoints = Math.max(0, (loyaltyRecord.totalPoints || 0) - pointsRedeemed);
                        loyaltyRecord.transactions.push({
                            orderId: newSale._id.toString(),
                            pointsEarned: 0,
                            pointsRedeemed: pointsRedeemed,
                            description: `Redeemed on Sale ${newSale.voucherNo || ''}`
                        });
                        await loyaltyRecord.save();
                    }
                }

                // 2. Process Earning: Evaluate points and coupons using PointsEngine
                const loyaltyItems = (newSale.items || []).map(item => ({
                    item_id: item.itemId ? item.itemId.toString() : null,
                    item_group_id: item.groupId || item.item_group_id || null,
                    price: item.price || item.listPrice || 0,
                    quantity: item.quantity || 1
                }));

                const orderTotal = newSale.netAmount || newSale.totalAmount || 0;

                const pointsResult = await PointsEngine.evaluate({
                    customerId,
                    items: loyaltyItems,
                    totalAmount: orderTotal,
                    invoiceId: newSale._id,
                    commit: true
                });

                if (pointsResult?.pointsAwarded && pointsResult.pointsAwarded > 0) {
                    newSale.loyaltyPointsEarned = pointsResult.pointsAwarded;
                    await newSale.save();
                }

                await CouponGiftEngine.evaluate({
                    customerId,
                    items: loyaltyItems,
                    totalAmount: orderTotal,
                    invoiceId: newSale._id,
                    commit: true
                });

                // Update customer visit count
                await Customer.findByIdAndUpdate(customerId, { $inc: { visitCount: 1 } });

            } catch (loyaltyErr) {
                console.error("Error processing loyalty points on sale creation:", loyaltyErr);
            }
        }

        res.status(201).json({
            success: true,
            message: "Sale Created Successfully",
            data: newSale,
            pointsEarned: newSale.loyaltyPointsEarned || 0,
            pointsRedeemed: newSale.loyaltyPointsRedeemed || 0
        });
    } catch (err) {
        console.error("Error in creating Sale:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all sales
exports.getAllSales = async (req, res) => {
    try {
        let query = { isActive: true };
        if (req.user?.salesman_id) {
            query.salesman = req.user.salesman_id;
        }
        const sales = await Sale.find(query)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id remarks')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .sort({ createdAt: -1 })
            .exec();

        res.status(200).json(sales);
    } catch (err) {
        console.error("Error in getAllSales:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id code')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .exec();

        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.status(200).json(sale);
    } catch (err) {
        console.error("Error in getSaleById:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update sale by ID
exports.updateSaleById = async (req, res) => {
    try {
        const saleData = { ...req.body };

        if (saleData.netAmount !== undefined) saleData.netAmount = Math.round(Number(saleData.netAmount) * 100) / 100;
        if (saleData.totalAmount !== undefined) saleData.totalAmount = Math.round(Number(saleData.totalAmount) * 100) / 100;
        if (saleData.totalDiscountAmount !== undefined) saleData.totalDiscountAmount = Math.round(Number(saleData.totalDiscountAmount) * 100) / 100;

        const updatedSale = await Sale.findByIdAndUpdate(
            req.params.id,
            saleData,
            { new: true }
        ).exec();

        if (!updatedSale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.status(200).json({ success: true, message: "Sale Updated Successfully", data: updatedSale });
    } catch (err) {
        console.error("Error in updateSaleById:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete sale by ID
exports.deleteSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // If loyalty points were redeemed, rollback to customer
        if (sale.loyaltyPointsRedeemed > 0 && sale.customer) {
            try {
                await LoyaltyLedger.create({
                    customerId: sale.customer,
                    sourceType: 'point',
                    sourceRefId: sale._id,
                    pointsEarned: sale.loyaltyPointsRedeemed,
                    pointsRedeemed: 0,
                    earnedDate: new Date()
                });
                const loyaltyRecord = await LoyaltyPoint.findOne({ customer: sale.customer });
                if (loyaltyRecord) {
                    loyaltyRecord.totalPoints = (loyaltyRecord.totalPoints || 0) + sale.loyaltyPointsRedeemed;
                    loyaltyRecord.transactions.push({
                        orderId: sale._id.toString(),
                        pointsEarned: sale.loyaltyPointsRedeemed,
                        pointsRedeemed: 0,
                        description: `Rollback on deletion of Sale ${sale.voucherNo}`
                    });
                    await loyaltyRecord.save();
                }
            } catch (rErr) {
                console.error("Error rolling back loyalty points on sale deletion:", rErr);
            }
        }

        await Sale.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Sale deleted successfully' });
    } catch (err) {
        console.error("Error in deleteSaleById:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Search sales
exports.searchSales = async (req, res) => {
    try {
        const searchQuery = req.query.q || req.query.search || '';
        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }
        const searchTerm = searchQuery.trim();

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
                { directCustomer: { $in: directCustomerIds } }
            ],
            isActive: true
        };

        const sales = await Sale.find(searchConditions)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .sort({ date: -1, createdAt: -1 })
            .limit(100)
            .lean()
            .exec();

        res.status(200).json({
            success: true,
            data: {
                orders: sales,
                count: sales.length,
                searchQuery: searchTerm
            }
        });
    } catch (error) {
        console.error('Error in searchSales:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Filter sales by date range and parameters
exports.getSalesByFilter = async (req, res) => {
    try {
        let query = { isActive: true };

        if (req.query.startDate || req.query.endDate) {
            query.date = {};
            if (req.query.startDate) {
                query.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        const sales = await Sale.find(query)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest _id')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .sort({ date: -1, createdAt: -1 })
            .exec();

        res.status(200).json({
            success: true,
            data: {
                orders: sales,
                count: sales.length
            }
        });
    } catch (error) {
        console.error('Error in getSalesByFilter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Process sale to Busy API (optional stub)
exports.processSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ status: false, message: 'Sale not found' });
        sale.busyApiStatus = 'SUCCESS';
        await sale.save();
        res.status(200).json({ status: true, message: 'Sale processed successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
