const express = require('express');
const router = express.Router();
const { updateProfile, getUserReservations, getUserReviews, toggleFavorite, getFavorites, getRecommendations } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.get('/reservations', protect, getUserReservations);
router.get('/reviews', protect, getUserReviews);
router.get('/recommendations', protect, getRecommendations);
// Favorites
router.post('/favorites/:restaurantId', protect, toggleFavorite);
router.get('/favorites', protect, getFavorites);

module.exports = router;
