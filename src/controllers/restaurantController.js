const restaurantService = require('../services/restaurantService');

const getAllRestaurants = async (req, res, next) => {
    try {
        const data = await restaurantService.getAllRestaurants(req.query);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const searchRestaurants = async (req, res, next) => {
    try {
        const { q } = req.query;
        const data = await restaurantService.searchRestaurants(q);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getRestaurantById = async (req, res, next) => {
    try {
        const data = await restaurantService.getRestaurantById(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(404);
        next(error);
    }
};

const getMyRestaurant = async (req, res, next) => {
    try {
        const restaurant = await restaurantService.getOwnerRestaurant(req.user._id);

        // Auto-check for expiration
        if (restaurant && restaurant.subscriptionExpiresAt) {
            const now = new Date();
            if (restaurant.subscriptionExpiresAt < now && restaurant.subscriptionStatus === 'active') {
                restaurant.subscriptionStatus = 'expired';
                await restaurant.save();

                if (global.io) {
                    global.io.emit('restaurantUpdated', { restaurantId: restaurant._id });
                }
            }
        }

        res.json(restaurant);
    } catch (error) {
        res.status(404);
        next(error);
    }
};

const createRestaurant = async (req, res, next) => {
    try {
        const data = await restaurantService.createRestaurant(req.user._id, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const updateRestaurant = async (req, res, next) => {
    try {
        const data = await restaurantService.updateRestaurant(req.params.id, req.user._id, req.body);
        if (global.io) {
            global.io.emit('globalUpdate');
        }
        res.json(data);
    } catch (error) {
        res.status(403);
        next(error);
    }
};

const updateCrowdLevel = async (req, res, next) => {
    try {
        const { crowdLevel } = req.body;
        const data = await restaurantService.updateCrowdLevel(req.params.id, req.user._id, crowdLevel);

        // Emit Socket.io event for real-time crowd update
        const io = req.app.get('io');
        if (io) {
            io.emit('crowdUpdated', { restaurantId: req.params.id, crowdLevel });
            io.emit('globalUpdate', { type: 'crowd_update', restaurantId: req.params.id });
        }

        res.json(data);
    } catch (error) {
        res.status(403);
        next(error);
    }
};

const Menu = require('../models/Menu');

const getMenu = async (req, res, next) => {
    try {
        const id = req.params.restaurantId || req.params.id;
        const menuItems = await Menu.find({ restaurantId: id, status: 'Active' });
        res.json(menuItems);
    } catch (error) {
        res.status(404);
        next(error);
    }
};

const getFilters = async (req, res, next) => {
    try {
        const filters = await restaurantService.getFilters();
        res.json(filters);
    } catch (error) {
        next(error);
    }
};

const getRecommendations = async (req, res, next) => {
    try {
        const restaurantId = req.params.id;
        const currentRestaurant = await restaurantService.getRestaurantById(restaurantId);
        
        if (!currentRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const Restaurant = require('../models/Restaurant');
        const Promotion = require('../models/Promotion');

        let recommendations = await Restaurant.find({
            _id: { $ne: restaurantId },
            isApproved: true,
            subscriptionStatus: 'active',
            cuisine: currentRestaurant.cuisine
        })
        .sort({ rating: -1 })
        .limit(8)
        .select('name location cuisine rating reviewCount images isApproved subscriptionStatus crowd'); 

        // Fallback: If no restaurants with the exact same cuisine, get highest rated overall
        if (recommendations.length === 0) {
            recommendations = await Restaurant.find({
                _id: { $ne: restaurantId },
                isApproved: true,
                subscriptionStatus: 'active'
            })
            .sort({ rating: -1 })
            .limit(8)
            .select('name location cuisine rating reviewCount images isApproved subscriptionStatus crowd');
        }

        // Attach promotion info & sort promoted restaurants to the top
        const activePromotions = await Promotion.find({ status: 'active', endDate: { $gte: new Date() } });
        if (activePromotions.length > 0) {
            const PromotionPackage = require('../models/PromotionPackage');
            const pkgs = await PromotionPackage.find({ isActive: true });
            const weight = {};
            pkgs.forEach(p => { weight[p.name] = p.weight || 1; });

            const promoMap = {};
            activePromotions.forEach(p => {
                const rId = p.restaurantId.toString();
                const currentTier = promoMap[rId] ? promoMap[rId].promotionType : null;
                if (!currentTier || (weight[p.promotionType] || 0) > (weight[currentTier] || 0)) {
                    promoMap[rId] = p;
                }
            });

            recommendations = recommendations.map(r => {
                const rObj = r.toObject ? r.toObject() : r;
                const promo = promoMap[r._id.toString()];
                if (promo) {
                    rObj.isPromoted = true;
                    rObj.promotionType = promo.promotionType;
                }
                return rObj;
            });

            recommendations.sort((a, b) => {
                const wA = a.isPromoted ? weight[a.promotionType] || 0 : 0;
                const wB = b.isPromoted ? weight[b.promotionType] || 0 : 0;
                if (wA !== wB) return wB - wA;
                return 0;
            });
        }

        // Return top 4 after sorting
        res.json(recommendations.slice(0, 4));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRestaurants,
    searchRestaurants,
    getRestaurantById,
    getMyRestaurant,
    createRestaurant,
    updateRestaurant,
    updateCrowdLevel,
    getMenu,
    getFilters,
    getRecommendations
};
