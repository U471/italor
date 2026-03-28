'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createProfileHandler,
  getProfilesHandler,
  updateProfileHandler,
  deleteProfileHandler,
} = require('../controllers/measurementProfile.controller');

const router = Router();

// All measurement profile routes require authentication
router.use(authenticate);

router.post('/', createProfileHandler);
router.get('/', getProfilesHandler);
router.put('/:id', updateProfileHandler);
router.delete('/:id', deleteProfileHandler);

module.exports = router;
