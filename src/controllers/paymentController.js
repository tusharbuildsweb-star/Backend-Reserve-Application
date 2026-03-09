const paymentService = require('../services/paymentService');

const createOrder = async (req, res, next) => {
    try {
        const { reservationId, amount } = req.body;
        const data = await paymentService.createOrder(reservationId, amount);
        res.status(201).json(data);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400);
            return next(new Error('Missing required payment verification fields.'));
        }

        const data = await paymentService.verifyPayment(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );
        res.json(data);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const handlePaymentFailure = async (req, res, next) => {
    try {
        const { razorpayOrderId } = req.body;
        const result = await paymentService.handlePaymentFailure(razorpayOrderId);
        res.json(result);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const webhook = async (req, res, next) => {
    try {
        const result = await paymentService.handleWebhook(req.body);
        res.json({ received: true });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    webhook,
    handlePaymentFailure
};
