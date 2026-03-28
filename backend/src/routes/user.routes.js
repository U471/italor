'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');
const { getMe, updateMe, updatePassword, updateAvatarHandler } = require('../controllers/user.controller');

const router = Router();

// All /api/v1/user routes require authentication
router.use(authenticate);

/** GET  /api/v1/user/me — Get full profile */
router.get('/me', getMe);

/** PUT  /api/v1/user/me — Update firstName, lastName, phone */
router.put('/me', updateMe);

/** PUT  /api/v1/user/me/password — Change password */
router.put('/me/password', updatePassword);

/** PUT  /api/v1/user/me/avatar — Upload new avatar */
router.post('/me/avatar', uploadAvatar.single('avatar'), updateAvatarHandler);

module.exports = router;
