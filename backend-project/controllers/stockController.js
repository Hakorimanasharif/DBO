const StockStatus = require('../models/StockStatus');
const Product = require('../models/Product');

const getStockStatuses = async (req, res) => {
  try {
    const stockStatuses = await StockStatus.find()
      .populate('product')
      .sort({ updatedAt: -1 });
    res.json(stockStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockStatusById = async (req, res) => {
  try {
    const stockStatus = await StockStatus.findById(req.params.id).populate(
      'product'
    );
    if (!stockStatus) {
      return res.status(404).json({ message: 'Stock status not found' });
    }
    res.json(stockStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStockStatus = async (req, res) => {
  try {
    const { product, quantity, lowStockThreshold } = req.body;

    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existing = await StockStatus.findOne({ product });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'Stock status already exists for this product' });
    }

    let status = 'inStock';
    if (quantity === 0) {
      status = 'outOfStock';
    } else if (quantity <= (lowStockThreshold || 10)) {
      status = 'lowStock';
    }

    const stockStatus = await StockStatus.create({
      product,
      quantity,
      lowStockThreshold,
      status,
    });

    const populated = await StockStatus.findById(stockStatus._id).populate(
      'product'
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStockStatus = async (req, res) => {
  try {
    const { quantity, lowStockThreshold, productName, category } = req.body;

    const stockStatus = await StockStatus.findById(req.params.id);
    if (!stockStatus) {
      return res.status(404).json({ message: 'Stock status not found' });
    }

    if (productName || category) {
      const productUpdate = {};
      if (productName !== undefined) productUpdate.name = productName;
      if (category !== undefined) productUpdate.category = category;
      await Product.findByIdAndUpdate(stockStatus.product, productUpdate, {
        new: true,
        runValidators: true,
      });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold;

    const newQuantity = quantity !== undefined ? quantity : stockStatus.quantity;
    const threshold =
      lowStockThreshold !== undefined
        ? lowStockThreshold
        : stockStatus.lowStockThreshold;

    updateData.status = 'inStock';
    if (newQuantity === 0) {
      updateData.status = 'outOfStock';
    } else if (newQuantity <= threshold) {
      updateData.status = 'lowStock';
    }

    const updated = await StockStatus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('product');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStockStatus = async (req, res) => {
  try {
    const stockStatus = await StockStatus.findByIdAndDelete(req.params.id);
    if (!stockStatus) {
      return res.status(404).json({ message: 'Stock status not found' });
    }
    res.json({ message: 'Stock status deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStockStatuses,
  getStockStatusById,
  createStockStatus,
  updateStockStatus,
  deleteStockStatus,
};
