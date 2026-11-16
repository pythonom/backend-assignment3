const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStockProducts,
  getCategorySummary
} = require("../controllers/productController");

const router = express.Router();

// Put specific report routes before /:id.
router.get("/reports/low-stock", getLowStockProducts);
router.get("/reports/category-summary", getCategorySummary);

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id/stock", adjustStock);
router.delete("/:id", deleteProduct);

module.exports = router;
