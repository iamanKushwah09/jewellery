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

router.route('/process/:id')
  .post(saleController.processSale)
  .get(saleController.processSale);

router.route('/:id')
  .get(saleController.getSaleById)
  .put(saleController.updateSaleById)
  .delete(saleController.deleteSaleById);

module.exports = router;
