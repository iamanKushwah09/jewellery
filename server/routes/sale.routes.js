const express = require('express');
const router = express.Router();
const saleController = require('../controller/sale.controller');

router.route('/')
  .post(saleController.createSale)
  .get(saleController.getAllSales);

router.route('/search')
  .get(saleController.searchSales);

router.route('/filter')
  .get(saleController.getSalesByFilter);

// Convert Sale Order to Sale Invoice (Business Logic Route)
router.route('/convert-order/:saleOrderId')
  .post(saleController.convertSaleOrderToSale);

router.route('/convert-order')
  .post(saleController.convertSaleOrderToSale);

// Fetch unbilled sale orders available to convert
router.route('/unbilled-orders')
  .get(saleController.getUnbilledSaleOrders);

// Fetch pending sale orders for a specific customer
router.route('/pending-orders/:customerId')
  .get(saleController.getPendingOrdersByCustomer);

router.route('/process/:id')
  .post(saleController.processSale)
  .get(saleController.processSale);

router.route('/:id')
  .get(saleController.getSaleById)
  .put(saleController.updateSaleById)
  .delete(saleController.deleteSaleById);

module.exports = router;
