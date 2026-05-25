const mongoose = require('mongoose');

const stockStatusSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      unique: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    status: {
      type: String,
      enum: ['inStock', 'lowStock', 'outOfStock'],
      default: 'inStock',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockStatus', stockStatusSchema);
