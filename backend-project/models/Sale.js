const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,  // Foreign key
      ref: 'Product',                         // References the Product model
      required: [true, 'Product is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    saleDate: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setHours(2, 0, 0, 0);
        return d;
      },
      validate: {
        validator: function (v) {
          return v <= new Date();
        },
        message: 'Sale date cannot be in the future',
      },
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
