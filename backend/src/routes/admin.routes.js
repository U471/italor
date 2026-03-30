'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadFabricImage } = require('../middleware/upload.middleware');
const {
  listFabrics,
  createFabric,
  updateFabric,
  deleteFabric,
  addFabricImage,
  removeFabricImage,
} = require('../controllers/admin.fabric.controller');
const {
  getStats,
  listAdminOrders,
  listAdminOrdersRules,
  getAdminOrder,
  orderIdRules,
  updateOrderStatus,
  updateStatusRules,
  processRefund,
} = require('../controllers/admin.order.controller');

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ── Fabric management ─────────────────────────────────────────────────────────

/** GET    /api/v1/admin/products           — list all fabrics (incl. inactive) */
router.get('/products', listFabrics);

/** POST   /api/v1/admin/products           — create a new fabric */
router.post('/products', createFabric);

/** PUT    /api/v1/admin/products/:id       — update a fabric */
router.put('/products/:id', updateFabric);

/** DELETE /api/v1/admin/products/:id       — soft-delete (deactivate) a fabric */
router.delete('/products/:id', deleteFabric);

/** POST   /api/v1/admin/products/:id/images — upload a fabric image */
router.post('/products/:id/images', uploadFabricImage.single('image'), addFabricImage);

/** DELETE /api/v1/admin/products/:id/images — remove a fabric image */
router.delete('/products/:id/images', removeFabricImage);

// ── Dashboard statistics ──────────────────────────────────────────────────────

/** GET /api/v1/admin/stats — aggregated KPI statistics */
router.get('/stats', getStats);

// ── Order management ──────────────────────────────────────────────────────────

/** GET   /api/v1/admin/orders            — paginated list of all orders */
router.get('/orders', listAdminOrdersRules, listAdminOrders);

/** GET   /api/v1/admin/orders/:orderId   — full order detail */
router.get('/orders/:orderId', orderIdRules, getAdminOrder);

/** PATCH /api/v1/admin/orders/:orderId/status — update order status */
router.patch('/orders/:orderId/status', updateStatusRules, updateOrderStatus);

/** POST  /api/v1/admin/orders/:orderId/refund — process Stripe refund */
router.post('/orders/:orderId/refund', orderIdRules, processRefund);

module.exports = router;
