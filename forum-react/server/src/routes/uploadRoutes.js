// src/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

// Upload de foto de perfil
router.post(
  '/profile-picture',
  authMiddleware.verifyToken,
  uploadController.uploadProfilePicture,
  uploadController.handleProfilePictureUpload
);

// Upload de imagem de post
router.post(
  '/post-image',
  authMiddleware.verifyToken,
  uploadController.uploadPostImage,
  uploadController.handlePostImageUpload
);

module.exports = router;
