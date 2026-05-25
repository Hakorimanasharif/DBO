const express = require('express');
const router = express.Router();
const {
  getStockStatuses,
  getStockStatusById,
  createStockStatus,
  updateStockStatus,
  deleteStockStatus,
} = require('../controllers/stockController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getStockStatuses);
router.get('/:id', protect, getStockStatusById);
router.post('/', protect, adminOnly, createStockStatus);
router.put('/:id', protect, adminOnly, updateStockStatus);
router.delete('/:id', protect, adminOnly, deleteStockStatus);

module.exports = router;
