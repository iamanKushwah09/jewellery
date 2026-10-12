const express = require('express');
const router = express.Router();
const {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} = require('../controller/salesmanRouteController');
const { isAuth } = require('../config/auth');

router.post('/', isAuth, createRoute);
router.get('/', isAuth, getAllRoutes);
router.get('/:id', isAuth, getRouteById);
router.put('/:id', isAuth, updateRoute);
router.delete('/:id', isAuth, deleteRoute);

module.exports = router;
