const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owner routes
router.post('/payment-order', protect, authorize('owner'), promotionController.createOrder);
router.post('/create', protect, authorize('owner'), promotionController.verifyAndCreatePromotion);
router.get('/owner', protect, authorize('owner'), promotionController.getOwnerPromotions);

// Admin routes
router.get('/admin', protect, authorize('admin'), promotionController.getAllPromotions);
router.put('/:id/approve', protect, authorize('admin'), promotionController.approvePromotion);
router.put('/:id/reject', protect, authorize('admin'), promotionController.rejectPromotion);

module.exports = router;
