const express = require('express');
const router = express.Router();
const PromotionPackage = require('../models/PromotionPackage');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// GET /api/v1/promotion-packages — public, get all active packages
router.get('/', async (req, res, next) => {
    try {
        const packages = await PromotionPackage.find({ isActive: true }).sort({ weight: -1 });
        res.json(packages);
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/promotion-packages/all — admin, get ALL packages (including inactive)
router.get('/all', protect, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const packages = await PromotionPackage.find().sort({ weight: -1 });
        res.json(packages);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/promotion-packages — admin only, create package
router.post('/', protect, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const { name, price, durationDays, description, weight, isActive } = req.body;
        const pkg = new PromotionPackage({ name, price, durationDays, description, weight, isActive });
        await pkg.save();

        if (global.io) {
            global.io.emit('promotionPackagesUpdated', { action: 'created', packageId: pkg._id });
        }

        res.status(201).json(pkg);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A package with this name already exists.' });
        }
        next(error);
    }
});

// PUT /api/v1/promotion-packages/:id — admin only, update package
router.put('/:id', protect, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const { name, price, durationDays, description, weight, isActive } = req.body;
        const pkg = await PromotionPackage.findByIdAndUpdate(
            req.params.id,
            { name, price, durationDays, description, weight, isActive },
            { new: true, runValidators: true }
        );
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        if (global.io) {
            global.io.emit('promotionPackagesUpdated', { action: 'updated', packageId: pkg._id });
        }

        res.json(pkg);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/promotion-packages/:id — admin only, delete package
router.delete('/:id', protect, authorizeRoles('admin'), async (req, res, next) => {
    try {
        const pkg = await PromotionPackage.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        if (global.io) {
            global.io.emit('promotionPackagesUpdated', { action: 'deleted', packageId: req.params.id });
        }

        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
