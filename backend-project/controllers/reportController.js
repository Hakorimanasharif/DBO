const Sale = require('../models/Sale');
const StockStatus = require('../models/StockStatus');

const getDailySalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate('product');

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    res.json({
      date: reportDate.toISOString().split('T')[0],
      totalSales,
      totalItems,
      numberOfTransactions: sales.length,
      sales,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockStatusReport = async (req, res) => {
  try {
    const stockStatuses = await StockStatus.find()
      .populate('product')
      .sort({ status: 1, quantity: 1 });

    const inStock = stockStatuses.filter((s) => s.status === 'inStock');
    const lowStock = stockStatuses.filter((s) => s.status === 'lowStock');
    const outOfStock = stockStatuses.filter((s) => s.status === 'outOfStock');

    res.json({
      totalProducts: stockStatuses.length,
      inStock: inStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      stockStatuses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDailySalesReport, getStockStatusReport };
