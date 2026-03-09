const reviewService = require('../services/reviewService');
const NotificationService = require('../services/notificationService');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const getReviews = async (req, res, next) => {
    try {
        const data = await reviewService.getReviewsByRestaurant(req.params.restaurantId);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const addReview = async (req, res, next) => {
    try {
        const data = await reviewService.addReview(req.user._id, req.body);
        if (global.io) {
            global.io.emit('globalUpdate');
            global.io.emit('newReviewAdded', data);
        }

        // Notify owner — review posted
        try {
            const restaurant = await Restaurant.findById(req.body.restaurantId);
            const reviewer = req.user; // has .name from protect middleware
            if (restaurant) {
                await NotificationService.notifyOwnerReviewPosted(data, restaurant, reviewer);
            }
        } catch (notifErr) {
            console.error('Review notification error:', notifErr);
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const editReview = async (req, res, next) => {
    try {
        const data = await reviewService.editReview(req.params.id, req.user._id, req.body);
        if (global.io) {
            global.io.emit('globalUpdate');
            global.io.emit('newReviewAdded', data);
        }
        res.json(data);
    } catch (error) {
        res.status(403);
        next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const data = await reviewService.deleteReview(req.params.id, req.user._id, req.user.role);
        if (global.io) {
            global.io.emit('globalUpdate');
            global.io.emit('newReviewAdded', { id: req.params.id, deleted: true });
        }
        res.json(data);
    } catch (error) {
        res.status(403);
        next(error);
    }
};

const ownerReply = async (req, res, next) => {
    try {
        const data = await reviewService.ownerReply(req.params.id, req.user._id, req.body.replyText);
        if (global.io) {
            global.io.emit('globalUpdate');
        }

        // Notify the reviewer — owner replied
        try {
            const restaurant = await Restaurant.findById(data.restaurantId);
            const reviewer = await User.findById(data.userId);
            if (restaurant && reviewer) {
                await NotificationService.notifyUserOwnerReplied(data, restaurant, reviewer);
            }
        } catch (notifErr) {
            console.error('Owner reply notification error:', notifErr);
        }

        res.json(data);
    } catch (error) {
        res.status(403);
        next(error);
    }
};

module.exports = {
    getReviews,
    addReview,
    editReview,
    deleteReview,
    ownerReply
};
