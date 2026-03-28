'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createDesignHandler,
  getDesignsHandler,
  getDesignByIdHandler,
  deleteDesignHandler,
} = require('../controllers/savedDesign.controller');

const router = Router();

// All saved-design routes require authentication
router.use(authenticate);

router.post('/', createDesignHandler);
router.get('/', getDesignsHandler);
router.get('/:id', getDesignByIdHandler);
router.delete('/:id', deleteDesignHandler);

module.exports = router;
