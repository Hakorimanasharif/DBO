const Product = require('../models/Product');

// READ all products (sorted by newest first)
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE a new product (with duplicate name check)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stockQuantity } = req.body;

    const existing = await Product.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existing) {
      return res.status(400).json({ message: 'A product with this name already exists' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stockQuantity,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE a product by ID (with duplicate name check)
const updateProduct = async (req, res) => {
  try {
    if (req.body.name) {
      const existing = await Product.findOne({
        name: new RegExp(`^${req.body.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a product by ID
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
