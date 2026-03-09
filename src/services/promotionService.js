const crypto = require('crypto');
const Promotion = require('../models/Promotion');
const Restaurant = require('../models/Restaurant');
const razorpay = require('../config/razorpay');
const sendEmail = require('../utils/sendEmail');
const NotificationService = require('./notificationService');

class PromotionService {
    // 1. Create a Razorpay Order for a promotion
    async createPromotionOrder(amount) {
        const options = {
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `promo_rect_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        return order;
    }

    // 2. Verify Payment and Create Promotion Request
    async verifyAndCreatePromotion(ownerId, data) {
        const { restaurantId, promotionType, startDate, endDate, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

        // Verify Signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new Error('Invalid payment signature');
        }

        // Check if restaurant belongs to owner
        const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
        if (!restaurant) {
            throw new Error('Restaurant not found or unauthorized');
        }

        // Create Promotion Request
        const promotion = new Promotion({
            restaurantId,
            ownerId,
            promotionType,
            startDate,
            endDate,
            amount,
            status: 'pending', // Awaiting Admin Approval
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id
        });

        await promotion.save();

        // Notify Admin
        // In a real app, notify super-admin
        await NotificationService.createNotification(
            null, // global or specific admin user ID
            'New Promotion Request',
            `Restaurant ${restaurant.name} has requested a ${promotionType} promotion.`,
            'promotion',
            'admin',
            '/admin/promotions',
            true
        );

        return promotion;
    }

    // 3. Get Owner's Promotions
    async getOwnerPromotions(ownerId) {
        return await Promotion.find({ ownerId }).populate('restaurantId', 'name images').sort({ createdAt: -1 });
    }

    // 4. Get All Promotions (for Admin)
    async getAllPromotions() {
        return await Promotion.find().populate('restaurantId', 'name loc images').populate('ownerId', 'name email').sort({ createdAt: -1 });
    }

    // 5. Approve Promotion (Admin)
    async approvePromotion(promotionId, adminId) {
        const promotion = await Promotion.findById(promotionId).populate('restaurantId');
        if (!promotion) throw new Error('Promotion not found');
        if (promotion.status !== 'pending') throw new Error('Only pending promotions can be approved');

        promotion.status = 'active';
        await promotion.save();

        await NotificationService.createNotification(
            promotion.ownerId,
            'Promotion Approved',
            `Your ${promotion.promotionType} promotion for ${promotion.restaurantId.name} is now active!`,
            'promotion',
            'owner',
            '/dashboard/owner',
            true
        );

        return promotion;
    }

    // 6. Reject Promotion (Admin)
    async rejectPromotion(promotionId, adminMessage) {
        const promotion = await Promotion.findById(promotionId).populate('restaurantId');
        if (!promotion) throw new Error('Promotion not found');
        if (promotion.status !== 'pending') throw new Error('Only pending promotions can be rejected');

        promotion.status = 'rejected';
        promotion.adminMessage = adminMessage;
        await promotion.save();

        // Initiate refund if needed (omitted for brevity, handled manually or via webhook usually)

        await NotificationService.createNotification(
            promotion.ownerId,
            'Promotion Rejected',
            `Your ${promotion.promotionType} promotion for ${promotion.restaurantId.name} was rejected. Reason: ${adminMessage || 'Not specified'}`,
            'promotion',
            'owner',
            '/dashboard/owner',
            true
        );

        return promotion;
    }
}

module.exports = new PromotionService();
