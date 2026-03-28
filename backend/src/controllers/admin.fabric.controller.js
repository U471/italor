'use strict';

const {
  adminListFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
  adminAddFabricImage,
  adminRemoveFabricImage,
} = require('../services/admin.fabric.service');

/** GET /api/v1/admin/products */
async function listFabrics(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await adminListFabrics({ page, limit });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/admin/products */
async function createFabric(req, res, next) {
  try {
    const fabric = await adminCreateFabric(req.body);
    return res.status(201).json({ fabric });
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/v1/admin/products/:id */
async function updateFabric(req, res, next) {
  try {
    const fabric = await adminUpdateFabric(req.params.id, req.body);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    return res.status(200).json({ fabric });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/v1/admin/products/:id */
async function deleteFabric(req, res, next) {
  try {
    const fabric = await adminDeleteFabric(req.params.id);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    return res.status(200).json({ message: 'Fabric deactivated successfully' });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/admin/products/:id/images */
async function addFabricImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const { secure_url: imageUrl, public_id: publicId } = req.file;
    const fabric = await adminAddFabricImage(req.params.id, imageUrl, publicId);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    return res.status(200).json({ fabric, imageUrl });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/v1/admin/products/:id/images */
async function removeFabricImage(req, res, next) {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }
    const fabric = await adminRemoveFabricImage(req.params.id, imageUrl);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    return res.status(200).json({ fabric });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listFabrics, createFabric, updateFabric, deleteFabric, addFabricImage, removeFabricImage };
