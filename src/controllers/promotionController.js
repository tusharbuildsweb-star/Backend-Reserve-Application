const promotionService = require('../services/promotionService');

const createOrder = async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount) throw new Error('Amount is required');
        const order = await promotionService.createPromotionOrder(amount);
        res.status(201).json(order);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const verifyAndCreatePromotion = async (req, res, next) => {
    try {
        const promotion = await promotionService.verifyAndCreatePromotion(req.user._id, req.body);
        
        if (global.io) {
            global.io.emit('promotionEvent', { type: 'newRequest' });
        }
        
        res.status(201).json(promotion);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getOwnerPromotions = async (req, res, next) => {
    try {
        const promotions = await promotionService.getOwnerPromotions(req.user._id);
        res.json(promotions);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getAllPromotions = async (req, res, next) => {
    try {
        const promotions = await promotionService.getAllPromotions();
        res.json(promotions);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const approvePromotion = async (req, res, next) => {
    try {
        const promotion = await promotionService.approvePromotion(req.params.id, req.user._id);
        if (global.io) {
            global.io.emit('promotionEvent', { type: 'approved', promotionId: promotion._id });
            global.io.emit('globalUpdate', { type: 'promotionApproved' });
        }
        res.json(promotion);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const rejectPromotion = async (req, res, next) => {
    try {
        const { adminMessage } = req.body;
        const promotion = await promotionService.rejectPromotion(req.params.id, adminMessage);
        if (global.io) {
            global.io.emit('promotionEvent', { type: 'rejected', promotionId: promotion._id });
            global.io.emit('globalUpdate', { type: 'promotionRejected' });
        }
        res.json(promotion);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

module.exports = {
    createOrder,
    verifyAndCreatePromotion,
    getOwnerPromotions,
    getAllPromotions,
    approvePromotion,
    rejectPromotion
};
