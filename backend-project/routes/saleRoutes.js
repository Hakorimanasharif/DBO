const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);
router.post('/', protect, createSale);
router.put('/:id', protect, adminOnly, updateSale);
router.delete('/:id', protect, adminOnly, deleteSale);

module.exports = router;
