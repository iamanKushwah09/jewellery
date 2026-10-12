const mongoose = require('mongoose');
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
const SaleOrder = require('../models/saleorder.model');
const dispatchlogModel = require('../models/dispatchlog.model');
const { recordStockMovement } = require('../services/inventory.service');

const generateUniqueSaleVoucher = async () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    let voucherNo;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 25) {
        const random = Math.floor(1000 + Math.random() * 9000);
        voucherNo = `SALE-${yyyy}${mm}${dd}-${random}`;
        const found = await Sale.findOne({ voucherNo });
        if (!found) {
            exists = false;
        }
        attempts++;
    }
    return voucherNo;
};

// Create a new Sale invoice
exports.createSale = async (req, res) => {
    try {
        const saleData = { ...req.body };
        if (!saleData.voucherNo || typeof saleData.voucherNo !== 'string' || saleData.voucherNo.trim() === '') {
            saleData.voucherNo = await generateUniqueSaleVoucher();
        }

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
                    const uVal = saleData.items[i].unit;
                    if (typeof uVal === 'object' && uVal !== null) {
                        saleData.items[i].unit = uVal.label || uVal.name || String(uVal.value || '');
                    } else if (mongoose.Types.ObjectId.isValid(uVal)) {
                        const unit = await Unit.findById(uVal);
                        if (unit && unit.name) {
                            saleData.items[i].unit = unit.name;
                        }
                    } else {
                        saleData.items[i].unit = String(uVal);
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

        // Sanitize sundries to ensure Name is always a valid non-empty string
        if (saleData.sundries && Array.isArray(saleData.sundries.SundriesDetail)) {
            saleData.sundries.SundriesDetail = saleData.sundries.SundriesDetail
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

        const newSale = new Sale(saleData);
        await newSale.save();

        // If linked to SaleOrder(s), update SaleOrder status & dispatch log with partial/full billing logic
        const linkedOrderIds = Array.isArray(saleData.saleOrders) && saleData.saleOrders.length > 0
            ? saleData.saleOrders
            : (saleData.saleOrder ? [saleData.saleOrder] : []);

        for (const oId of linkedOrderIds) {
            try {
                const origSO = await SaleOrder.findById(oId);
                if (origSO) {
                    // Update item-level billedQuantity in origSO based on billed items in saleData
                    let billedInThisOrder = 0;
                    const usedSaleItemIndices = new Set();

                    for (const soItem of (origSO.items || [])) {
                        const soItemIdStr = (soItem.itemId?._id || soItem.itemId || '').toString();
                        let matchedIdx = -1;
                        for (let sIdx = 0; sIdx < (saleData.items || []).length; sIdx++) {
                            if (usedSaleItemIndices.has(sIdx)) continue;
                            const it = saleData.items[sIdx];
                            const saleItemIdStr = (it.itemId?._id || it.itemId || '').toString();
                            if (soItemIdStr && saleItemIdStr && soItemIdStr === saleItemIdStr) {
                                if (soItem.color && it.color && String(soItem.color).trim().toLowerCase() !== String(it.color).trim().toLowerCase()) continue;
                                if (soItem.size && it.size && String(soItem.size).trim().toLowerCase() !== String(it.size).trim().toLowerCase()) continue;
                                matchedIdx = sIdx;
                                break;
                            }
                        }

                        if (matchedIdx !== -1) {
                            usedSaleItemIndices.add(matchedIdx);
                            const matchingSaleItem = saleData.items[matchedIdx];
                            const billedQty = Number(matchingSaleItem.quantity) || 0;
                            soItem.billedQuantity = (Number(soItem.billedQuantity) || 0) + billedQty;
                            billedInThisOrder += billedQty;
                        }
                    }

                    if (billedInThisOrder === 0) {
                        billedInThisOrder = Number(saleData.totalQuantity) || (saleData.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                    }

                    const totalOrderedQty = origSO.totalQuantity || origSO.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 0;
                    origSO.totalBilledQuantity = (Number(origSO.totalBilledQuantity) || 0) + billedInThisOrder;

                    // Determine whether Fully Billed or Partially Billed
                    const isFullyBilled = origSO.totalBilledQuantity >= totalOrderedQty;
                    const nextInvoicedStatus = isFullyBilled ? 'Fully Billed' : 'Partially Billed';
                    const nextOrderStatus = isFullyBilled ? 'Delivered' : 'Processing';

                    origSO.invoicedStatus = nextInvoicedStatus;
                    origSO.convertedSaleId = newSale._id;
                    origSO.saleVoucherNo = newSale.voucherNo;
                    origSO.status = nextOrderStatus;
                    await origSO.save();

                    if (!newSale.saleOrder) {
                        newSale.saleOrder = origSO._id;
                        newSale.saleOrderVoucherNo = origSO.voucherNo;
                    }
                    if (!newSale.saleOrders) newSale.saleOrders = [];
                    if (!newSale.saleOrders.includes(origSO._id)) newSale.saleOrders.push(origSO._id);
                    if (!newSale.saleOrderVouchers) newSale.saleOrderVouchers = [];
                    if (!newSale.saleOrderVouchers.includes(origSO.voucherNo)) newSale.saleOrderVouchers.push(origSO.voucherNo);
                    await newSale.save();

                    await dispatchlogModel.create({
                        status: nextOrderStatus,
                        orderDetails_id: origSO._id,
                        updateDescription: `Billed on Sale Invoice ${newSale.voucherNo} (${nextInvoicedStatus} - Billed ${billedInThisOrder} qty, Cumulative: ${origSO.totalBilledQuantity}/${totalOrderedQty})`,
                        grNo: origSO.grNo || '',
                        lot: origSO.lotNo || '',
                        images: []
                    });
                }
            } catch (soErr) {
                console.error("Error updating linked sale order on createSale:", soErr);
            }
        }

        // Deduct inventory stock for billed items and record lifetime stock history
        for (const item of (saleData.items || [])) {
            const rawItemId = item.itemId?._id || item.itemId;
            const deductQty = Number(item.quantity) || 0;
            if (rawItemId && deductQty > 0) {
                try {
                    const itemDoc = await Item.findById(rawItemId);
                    if (itemDoc) {
                        const previousStock = Number(itemDoc.stock) || 0;
                        const newStock = previousStock - deductQty;
                        itemDoc.stock = newStock;
                        await itemDoc.save();

                        await recordStockMovement({
                            item: itemDoc,
                            previous_stock: previousStock,
                            current_stock: newStock,
                            movement_type: "sale",
                            reference_type: "SALE_INVOICE",
                            reference_id: newSale._id ? String(newSale._id) : "",
                            channel: "WEB_ADMIN",
                            source_code: 5,
                            source_name: "sale",
                            notes: `Sold ${deductQty} ${item.unit || itemDoc.unit || 'units'} via Sale Invoice #${newSale.voucherNo || "—"}`,
                            updated_by: req.admin?.email || req.admin?.name || "Sale Billing",
                        });
                    }
                } catch (stockErr) {
                    console.error(`Error updating stock in createSale:`, stockErr);
                }
            }
        }

        // Process Loyalty (Tier benefits, Coupons, Points Redemption & Earning)
        if (saleData.customer) {
            try {
                const customerId = saleData.customer;
                const pointsRedeemed = Number(saleData.loyaltyPointsRedeemed) || 0;

                // 1. Process Points Redemption: Deduct points from LoyaltyLedger (FIFO) & LoyaltyPoint
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

                // 2. Process Coupon Redemption: Mark LoyaltyIssuedCoupon as used
                if (saleData.loyaltyCouponId || saleData.loyaltyCouponCode) {
                    try {
                        const { LoyaltyIssuedCoupon } = require('../models/loyaltyCoupon.model');
                        const couponQuery = saleData.loyaltyCouponId
                            ? { _id: saleData.loyaltyCouponId }
                            : { couponCode: { $regex: new RegExp(`^${(saleData.loyaltyCouponCode || '').trim()}$`, 'i') } };

                        const coupon = await LoyaltyIssuedCoupon.findOne(couponQuery);
                        if (coupon && !coupon.isUsed) {
                            coupon.isUsed = true;
                            coupon.usedOnInvoiceId = newSale._id;
                            await coupon.save();
                        }
                    } catch (cErr) {
                        console.error("Error marking loyalty coupon as used:", cErr);
                    }
                }

                // 3. Process Earning: Evaluate points and coupons using PointsEngine
                const loyaltyItems = (newSale.items || []).map(item => ({
                    item_id: item.itemId ? item.itemId.toString() : null,
                    item_group_id: item.groupId || item.item_group_id || null,
                    brand_id: item.brand_id || null,
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
            .populate('saleOrder', 'voucherNo')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        for (const s of (sales || [])) {
            if (!s.saleOrderVoucherNo && s.saleOrder?.voucherNo) {
                s.saleOrderVoucherNo = s.saleOrder.voucherNo;
            }
        }

        res.status(200).json(sales);
    } catch (err) {
        console.error("Error in getAllSales:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }
        const sale = await Sale.findById(req.params.id)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile address gst_type group_type gst_no aadhaar_no pincode is_guest shippingAddress _id code')
            .populate('directCustomer')
            .populate('salesman', 'name code')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute')
            .populate('saleOrder', 'voucherNo')
            .exec();

        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        if (!sale.saleOrderVoucherNo && sale.saleOrder?.voucherNo) {
            sale.saleOrderVoucherNo = sale.saleOrder.voucherNo;
        }
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

        // If loyalty points were earned on this sale, reverse them
        if (sale.loyaltyPointsEarned > 0 && sale.customer) {
            try {
                await LoyaltyLedger.updateMany(
                    { customerId: sale.customer, invoiceId: sale._id },
                    { isExpired: true, pointsRedeemed: sale.loyaltyPointsEarned }
                );
                const loyaltyRecord = await LoyaltyPoint.findOne({ customer: sale.customer });
                if (loyaltyRecord) {
                    loyaltyRecord.totalPoints = Math.max(0, (loyaltyRecord.totalPoints || 0) - sale.loyaltyPointsEarned);
                    loyaltyRecord.transactions.push({
                        orderId: sale._id.toString(),
                        pointsEarned: 0,
                        pointsRedeemed: sale.loyaltyPointsEarned,
                        description: `Reversal of points earned on deletion of Sale ${sale.voucherNo}`
                    });
                    await loyaltyRecord.save();
                }
            } catch (eErr) {
                console.error("Error rolling back earned loyalty points on sale deletion:", eErr);
            }
        }

        // If a loyalty coupon was used, rollback coupon status
        if ((sale.loyaltyCouponId || sale.loyaltyCouponCode) && sale.customer) {
            try {
                const { LoyaltyIssuedCoupon } = require('../models/loyaltyCoupon.model');
                const couponQuery = sale.loyaltyCouponId
                    ? { _id: sale.loyaltyCouponId }
                    : { couponCode: { $regex: new RegExp(`^${(sale.loyaltyCouponCode || '').trim()}$`, 'i') } };
                await LoyaltyIssuedCoupon.findOneAndUpdate(couponQuery, {
                    isUsed: false,
                    usedOnInvoiceId: null
                });
            } catch (cErr) {
                console.error("Error rolling back loyalty coupon on sale deletion:", cErr);
            }
        }

        // Restore inventory stock on sale deletion
        if (sale.items && sale.items.length > 0) {
            for (const it of sale.items) {
                const rawItemId = it.itemId?._id || it.itemId;
                const restoreQty = Number(it.quantity) || 0;
                if (rawItemId && restoreQty > 0) {
                    try {
                        const itemDoc = await Item.findById(rawItemId);
                        if (itemDoc) {
                            const previousStock = Number(itemDoc.stock) || 0;
                            const newStock = previousStock + restoreQty;
                            itemDoc.stock = newStock;
                            await itemDoc.save();

                            await recordStockMovement({
                                item: itemDoc,
                                previous_stock: previousStock,
                                current_stock: newStock,
                                movement_type: "stock",
                                reference_type: "SALE_DELETE_RESTOCK",
                                reference_id: sale._id ? String(sale._id) : "",
                                channel: "WEB_ADMIN",
                                source_code: 2,
                                source_name: "stock",
                                notes: `Restored ${restoreQty} ${it.unit || itemDoc.unit || 'units'} on deletion of Sale #${sale.voucherNo || "—"}`,
                                updated_by: req.admin?.email || req.admin?.name || "Admin",
                            });
                        }
                    } catch (sErr) {
                        console.error("Error restoring stock on sale deletion:", sErr);
                    }
                }
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
            .populate('saleOrder', 'voucherNo')
            .sort({ date: -1, createdAt: -1 })
            .limit(100)
            .lean()
            .exec();

        for (const s of (sales || [])) {
            if (!s.saleOrderVoucherNo && s.saleOrder?.voucherNo) {
                s.saleOrderVoucherNo = s.saleOrder.voucherNo;
            }
        }

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
            .populate('saleOrder', 'voucherNo')
            .sort({ date: -1, createdAt: -1 })
            .lean()
            .exec();

        for (const s of (sales || [])) {
            if (!s.saleOrderVoucherNo && s.saleOrder?.voucherNo) {
                s.saleOrderVoucherNo = s.saleOrder.voucherNo;
            }
        }

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

/**
 * Convert Sale Order to Sale Invoice (Business Logic)
 * 1. Validates SaleOrder existence and active status
 * 2. Checks order is not Cancelled and not already Fully Billed
 * 3. Copies all items, pricing, discounts, sundries, customer and salesman info
 * 4. Deducts stock from inventory (Item model)
 * 5. Creates new Sale document linked to the original SaleOrder
 * 6. Updates SaleOrder status (invoicedStatus: 'Fully Billed', convertedSaleId, saleVoucherNo)
 * 7. Logs the conversion in DispatchLog for complete audit history
 * 8. Evaluates Loyalty Points & Customer visit count
 */
exports.convertSaleOrderToSale = async (req, res) => {
    try {
        const saleOrderId = req.params.saleOrderId || req.body.saleOrderId;

        if (!saleOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Sale Order ID is required'
            });
        }

        // Validate MongoDB ObjectId
        if (!saleOrderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Sale Order ID format'
            });
        }

        // Fetch original Sale Order with populated references
        const saleOrder = await SaleOrder.findById(saleOrderId);

        if (!saleOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sale Order not found'
            });
        }

        if (saleOrder.isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'Cannot convert inactive or deleted Sale Order'
            });
        }

        // Business Rule: Cancelled order cannot be converted
        if (saleOrder.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cancelled Sale Order cannot be converted to Sale Invoice'
            });
        }

        // Business Rule: Idempotency / Duplicate conversion check
        if (saleOrder.invoicedStatus === 'Fully Billed' && saleOrder.convertedSaleId) {
            const existingSale = await Sale.findById(saleOrder.convertedSaleId);
            return res.status(400).json({
                success: false,
                message: `Sale Order is already converted to Sale Invoice (${saleOrder.saleVoucherNo || existingSale?.voucherNo || 'N/A'})`,
                alreadyConverted: true,
                existingSaleId: saleOrder.convertedSaleId,
                existingVoucherNo: saleOrder.saleVoucherNo || existingSale?.voucherNo
            });
        }

        if (!saleOrder.items || saleOrder.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Sale Order has no items to bill'
            });
        }

        // Prepare Sale items payload with fallback safety
        const saleItems = saleOrder.items.map(item => {
            const itemObj = item.toObject ? item.toObject() : { ...item };
            delete itemObj._id; // New subdocument ID for Sale
            return {
                itemId: itemObj.itemId,
                name: itemObj.name || '',
                hsn: itemObj.hsn || '',
                image: typeof itemObj.image === 'string' ? itemObj.image : '',
                listPrice: Number(itemObj.listPrice) || 0,
                price: Number(itemObj.price) || 0,
                quantity: Number(itemObj.quantity) || 0,
                unit: itemObj.unit || '',
                conversion_factor: itemObj.conversion_factor || 1,
                discount: Number(itemObj.discount) || 0,
                totalDiscount: Number(itemObj.totalDiscount) || 0,
                amount: Number(itemObj.amount) || 0,
                color: itemObj.color || '',
                size: itemObj.size || '',
                description: itemObj.description || ''
            };
        });

        // Construct Sale document data
        const saleData = {
            voucherNo: await generateUniqueSaleVoucher(),
            saleOrder: saleOrder._id,
            saleOrderVoucherNo: saleOrder.voucherNo,
            saleType: saleOrder.saleType,
            saleTypeCode: saleOrder.saleTypeCode,
            matCentre: req.body.matCentre || saleOrder.matCentre || 'Main Store',
            date: req.body.date ? new Date(req.body.date) : new Date(),
            customer: saleOrder.customer,
            customerCode: saleOrder.customerCode,
            directCustomer: saleOrder.directCustomer,
            salesman: saleOrder.salesman,
            salesmanCode: saleOrder.salesmanCode,
            items: saleItems,
            netAmount: Math.round(Number(saleOrder.netAmount || 0) * 100) / 100,
            sundries: saleOrder.sundries || { SundriesDetail: [] },
            totalAmount: Math.round(Number(saleOrder.totalAmount || 0) * 100) / 100,
            totalDiscountAmount: Math.round(Number(saleOrder.totalDiscountAmount || 0) * 100) / 100,
            totalQuantity: Number(saleOrder.totalQuantity) || 0,
            status: req.body.status || 'Completed',
            description: req.body.description || `Converted from Sale Order ${saleOrder.voucherNo}`,
            loyaltyPointsRedeemed: Number(req.body.redeemPoints) || 0
        };

        // Sanitize sundries to ensure Name is always a valid non-empty string
        if (saleData.sundries && Array.isArray(saleData.sundries.SundriesDetail)) {
            saleData.sundries.SundriesDetail = saleData.sundries.SundriesDetail
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

        // Create new Sale instance
        const newSale = new Sale(saleData);
        await newSale.save();

        // Stock deduction (Hard deduction upon invoicing) and record lifetime stock history
        const deductStock = req.body.deductStock !== false;
        if (deductStock) {
            for (const item of (saleOrder.items || [])) {
                const rawItemId = item.itemId?._id || item.itemId;
                const deductQty = Number(item.quantity) || 0;
                if (rawItemId && deductQty > 0) {
                    try {
                        const itemDoc = await Item.findById(rawItemId);
                        if (itemDoc) {
                            const previousStock = Number(itemDoc.stock) || 0;
                            const newStock = previousStock - deductQty;
                            itemDoc.stock = newStock;
                            await itemDoc.save();

                            await recordStockMovement({
                                item: itemDoc,
                                previous_stock: previousStock,
                                current_stock: newStock,
                                movement_type: "sale",
                                reference_type: "SALE_INVOICE",
                                reference_id: newSale._id ? String(newSale._id) : "",
                                channel: "WEB_ADMIN",
                                source_code: 5,
                                source_name: "sale",
                                notes: `Sold ${deductQty} ${item.unit || itemDoc.unit || 'units'} via Sale Invoice #${newSale.voucherNo || "—"} (Order #${saleOrder.voucherNo || "—"})`,
                                updated_by: req.admin?.email || req.admin?.name || "Sale Billing",
                            });
                        }
                    } catch (stockErr) {
                        console.error(`Error updating stock for item ${item.itemId}:`, stockErr);
                    }
                }
            }
        }

        // Update original Sale Order items and total billed quantities
        for (const it of (saleOrder.items || [])) {
            it.billedQuantity = Number(it.quantity) || 0;
        }
        saleOrder.totalBilledQuantity = saleOrder.totalQuantity || (saleOrder.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        saleOrder.invoicedStatus = 'Fully Billed';
        saleOrder.convertedSaleId = newSale._id;
        saleOrder.saleVoucherNo = newSale.voucherNo;

        // If order was in Start or Processing, progress to Dispatched / Delivered
        if (saleOrder.status === 'Start' || saleOrder.status === 'Processing') {
            saleOrder.status = req.body.orderStatus || 'Delivered';
        }
        await saleOrder.save();

        // Audit Trail: Create Dispatch Log
        try {
            await dispatchlogModel.create({
                status: saleOrder.status,
                orderDetails_id: saleOrder._id,
                updateDescription: `Converted to Sale Tax Invoice: ${newSale.voucherNo}`,
                grNo: saleOrder.grNo || '',
                lot: saleOrder.lotNo || '',
                images: []
            });
        } catch (logErr) {
            console.error('Error logging dispatch for conversion:', logErr);
        }

        // Process Loyalty Points (Redemption & Earning)
        if (saleData.customer) {
            try {
                const customerId = saleData.customer;
                const pointsRedeemed = Number(saleData.loyaltyPointsRedeemed) || 0;

                // 1. Process Redemption if points were used
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

                    await LoyaltyLedger.create({
                        customerId,
                        sourceType: 'redemption',
                        sourceRefId: newSale._id,
                        pointsEarned: 0,
                        pointsRedeemed: pointsRedeemed,
                        earnedDate: new Date()
                    });

                    let loyaltyRecord = await LoyaltyPoint.findOne({ customer: customerId });
                    if (loyaltyRecord) {
                        loyaltyRecord.totalPoints = Math.max(0, (loyaltyRecord.totalPoints || 0) - pointsRedeemed);
                        loyaltyRecord.transactions.push({
                            orderId: newSale._id.toString(),
                            pointsEarned: 0,
                            pointsRedeemed: pointsRedeemed,
                            description: `Redeemed on Converted Sale ${newSale.voucherNo}`
                        });
                        await loyaltyRecord.save();
                    }
                }

                // 2. Process Earning via PointsEngine
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

                // Increment customer visit count
                await Customer.findByIdAndUpdate(customerId, { $inc: { visitCount: 1 } });

            } catch (loyaltyErr) {
                console.error("Error processing loyalty on order conversion:", loyaltyErr);
            }
        }

        return res.status(201).json({
            success: true,
            message: `Sale Order ${saleOrder.voucherNo} successfully converted to Sale Invoice ${newSale.voucherNo}`,
            data: newSale,
            saleOrder: {
                _id: saleOrder._id,
                voucherNo: saleOrder.voucherNo,
                invoicedStatus: saleOrder.invoicedStatus,
                status: saleOrder.status,
                saleVoucherNo: saleOrder.saleVoucherNo
            }
        });

    } catch (err) {
        console.error('Error in convertSaleOrderToSale:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error during order conversion'
        });
    }
};

/**
 * Get all unbilled Sale Orders ready for conversion
 */
exports.getUnbilledSaleOrders = async (req, res) => {
    try {
        const query = {
            isActive: true,
            status: { $ne: 'Cancelled' },
            $or: [
                { invoicedStatus: 'Unbilled' },
                { invoicedStatus: { $exists: false } },
                { invoicedStatus: null }
            ]
        };

        const unbilledOrders = await SaleOrder.find(query)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile code address')
            .populate('directCustomer', 'name email mobile address')
            .populate('salesman', 'name code')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
            .exec();

        return res.status(200).json({
            success: true,
            count: unbilledOrders.length,
            data: unbilledOrders
        });
    } catch (err) {
        console.error('Error in getUnbilledSaleOrders:', err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Get all pending/unbilled Sale Orders for a specific customer
 * Used by the SaleDrawer when party is selected to prompt user with pending orders
 */
exports.getPendingOrdersByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ success: false, message: 'Customer ID is required' });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(customerId);
        const customerOrConditions = [];
        if (isObjectId) {
            customerOrConditions.push({ customer: new mongoose.Types.ObjectId(customerId) });
        }
        customerOrConditions.push({ customerCode: String(customerId) });

        // Also check if customer document exists to grab both its _id and its code
        try {
            let custDoc = null;
            if (isObjectId) {
                custDoc = await Customer.findById(customerId).lean();
            }
            if (!custDoc) {
                custDoc = await Customer.findOne({ code: String(customerId) }).lean();
            }
            if (custDoc) {
                customerOrConditions.push({ customer: custDoc._id });
                if (custDoc.code) {
                    customerOrConditions.push({ customerCode: String(custDoc.code) });
                }
            }
        } catch (cErr) {
            console.error("Error finding customer doc:", cErr);
        }

        const query = {
            isActive: true,
            status: { $ne: 'Cancelled' },
            $and: [
                {
                    $or: [
                        { invoicedStatus: 'Unbilled' },
                        { invoicedStatus: 'Partially Billed' },
                        { invoicedStatus: { $exists: false } },
                        { invoicedStatus: null }
                    ]
                },
                {
                    $or: customerOrConditions
                }
            ]
        };

        const pendingOrders = await SaleOrder.find(query)
            .populate('saleType', 'name code')
            .populate('customer', 'name email mobile code address')
            .populate('directCustomer', 'name email mobile address')
            .populate('salesman', 'name code')
            .populate('items.itemId', 'name hsn_code unit_id sale_price discount conversion_factor image default_image item_attribute stock item_code')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        // Enrich items with pending quantity calculations
        const enrichedOrders = (pendingOrders || []).map(order => {
            const items = (order.items || []).map(it => {
                const orderedQty = Number(it.quantity) || 0;
                const billedQty = Number(it.billedQuantity) || 0;
                const pendingQty = Math.max(0, orderedQty - billedQty);
                return {
                    ...it,
                    orderedQty,
                    billedQty,
                    pendingQty
                };
            });

            const totalOrderedQty = order.totalQuantity || items.reduce((s, it) => s + it.orderedQty, 0);
            const totalBilledQty = order.totalBilledQuantity || items.reduce((s, it) => s + it.billedQty, 0);
            const totalPendingQty = Math.max(0, totalOrderedQty - totalBilledQty);

            return {
                ...order,
                items,
                totalOrderedQty,
                totalBilledQty,
                totalPendingQty
            };
        }).filter(order => order.totalPendingQty > 0 || order.invoicedStatus !== 'Fully Billed');

        return res.status(200).json({
            success: true,
            count: enrichedOrders.length,
            orders: enrichedOrders
        });
    } catch (err) {
        console.error('Error in getPendingOrdersByCustomer:', err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

