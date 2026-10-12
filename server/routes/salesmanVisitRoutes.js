const express = require('express');
const router = express.Router();
const {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisit,
  checkInVisit,
  checkOutVisit,
  addVisitPhoto,
  deleteVisit,
} = require('../controller/salesmanVisitController');
const { isAuth } = require('../config/auth');

router.post('/', isAuth, createVisit);
router.get('/', isAuth, getAllVisits);
router.get('/:id', isAuth, getVisitById);
router.put('/:id', isAuth, updateVisit);
router.put('/:id/check-in', isAuth, checkInVisit);
router.put('/:id/check-out', isAuth, checkOutVisit);
router.post('/:id/add-photo', isAuth, addVisitPhoto);
router.delete('/:id', isAuth, deleteVisit);

module.exports = router;
