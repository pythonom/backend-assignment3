const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    lowStock,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: new RegExp(safeSearch, "i") },
      { sku: new RegExp(safeSearch, "i") },
      { description: new RegExp(safeSearch, "i") },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  if (lowStock === "true") {
    filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const allowedSortFields = [
    "name",
    "price",
    "quantity",
    "createdAt",
    "category",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
    data: products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "sku",
    "category",
    "price",
    "reorderLevel",
    "description",
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ success: true, data: product });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { operation, quantity } = req.body;

  if (!["restock", "sale"].includes(operation)) {
    res.status(400);
    throw new Error("operation must be either 'restock' or 'sale'");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    res.status(400);
    throw new Error("quantity must be a positive whole number");
  }

  const condition = { _id: req.params.id };
  const update =
    operation === "restock"
      ? { $inc: { quantity } }
      : { $inc: { quantity: -quantity } };

  if (operation === "sale") condition.quantity = { $gte: quantity };

  const product = await Product.findOneAndUpdate(condition, update, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.status(400);
    throw new Error("Insufficient stock for this sale");
  }

  res.json({
    success: true,
    message: "Stock updated successfully",
    data: product,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, message: "Product deleted successfully" });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  }).sort({ quantity: 1 });

  res.json({ success: true, count: products.length, data: products });
});

const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: "$quantity" },
        inventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalProducts: 1,
        totalUnits: 1,
        inventoryValue: { $round: ["$inventoryValue", 2] },
      },
    },
  ]);

  res.json({ success: true, data: summary });
});

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStockProducts,
  getCategorySummary,
};
