const Sale = require('../models/Sale');
const Product = require('../models/Product');

// READ all sales (populated with product, sorted by date)
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('product').sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ single sale by ID
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('product');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE a new sale (validates stock, calculates total, decrements inventory)
const createSale = async (req, res) => {
  try {
    const { product: productId, quantity, customerName, saleDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    if (saleDate && new Date(saleDate) > new Date()) {
      return res.status(400).json({ message: 'Sale date cannot be in the future' });
    }

    const totalPrice = product.price * quantity;

    const sale = await Sale.create({
      product: productId,
      quantity,
      totalPrice,
      customerName,
      ...(saleDate && { saleDate }),
    });

    product.stockQuantity -= quantity;
    await product.save();

    const populatedSale = await Sale.findById(sale._id).populate('product');
    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE a sale by ID
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('product');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a sale by ID
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};
