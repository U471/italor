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

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

/** GET  /api/v1/admin/products           — list all fabrics (incl. inactive) */
router.get('/products', listFabrics);

/** POST /api/v1/admin/products           — create a new fabric */
router.post('/products', createFabric);

/** PUT  /api/v1/admin/products/:id       — update a fabric */
router.put('/products/:id', updateFabric);

/** DELETE /api/v1/admin/products/:id    — soft-delete (deactivate) a fabric */
router.delete('/products/:id', deleteFabric);

/** POST   /api/v1/admin/products/:id/images — upload a fabric image */
router.post('/products/:id/images', uploadFabricImage.single('image'), addFabricImage);

/** DELETE /api/v1/admin/products/:id/images — remove a fabric image */
router.delete('/products/:id/images', removeFabricImage);

module.exports = router;
