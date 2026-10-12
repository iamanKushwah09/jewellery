/**
 * Schema Routes — Structured data endpoints for SEO
 */

const express = require('express');
const router = express.Router();
const schemaController = require('../controller/schema.controller');

// Organization schema
router.get('/organization', schemaController.getOrganizationSchema);

// Product list schema
router.get('/products', schemaController.getProductListSchema);

// Single product schema
router.get('/product/:slug', schemaController.getProductSchema);

module.exports = router;
