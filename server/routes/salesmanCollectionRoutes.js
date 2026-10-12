const express = require('express');
const router = express.Router();
const {
  addCollection,
  getCollectionReport,
} = require('../controller/salesmanCollectionController');
const { isAuth } = require('../config/auth');

router.post('/', isAuth, addCollection);
router.get('/report', isAuth, getCollectionReport);

module.exports = router;
