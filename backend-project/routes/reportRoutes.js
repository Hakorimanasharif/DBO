const express = require('express');
const router = express.Router();
const {
  getDailySalesReport,
  getStockStatusReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/daily-sales', protect, getDailySalesReport);
router.get('/stock-status', protect, getStockStatusReport);

module.exports = router;
