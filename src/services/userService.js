const User = require('../models/User');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');

class UserService {
    async updateProfile(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update Email if provided and not taken
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await User.findOne({ email: updateData.email });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
            user.email = updateData.email;
        }

        user.name = updateData.name || user.name;
        user.mobileNumber = updateData.mobileNumber !== undefined ? updateData.mobileNumber : user.mobileNumber;
        user.profileImage = updateData.profileImage || user.profileImage;

        if (updateData.password) {
            user.password = updateData.password;
        }

        await user.save();

        if (global.io) {
            global.io.emit('globalUpdate', {
                type: 'profileUpdated',
                userId
            });
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobileNumber: user.mobileNumber,
            profileImage: user.profileImage
        };
    }

    async getUserReservations(userId) {
        return await Reservation.find({ userId })
            .populate('restaurantId', 'name image location')
            .populate('packageId', 'title')
            .sort({ date: -1 });
    }

    async getUserReviews(userId) {
        return await Review.find({ userId })
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 });
    }

    async toggleFavorite(userId, restaurantId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const index = user.favorites.indexOf(restaurantId);
        if (index === -1) {
            user.favorites.push(restaurantId);
        } else {
            user.favorites.splice(index, 1);
        }

        await user.save();
        return user.favorites;
    }

    async getFavorites(userId) {
        const user = await User.findById(userId).populate({
            path: 'favorites',
            select: 'name description location rating averageCost image images cuisine'
        });
        if (!user) throw new Error('User not found');
        return user.favorites;
    }

    async getRecommendations(userId) {
        const Restaurant = require('../models/Restaurant');
        
        // 1. Fetch user's reservations to find frequently visited restaurants
        const reservations = await Reservation.find({ userId, status: 'completed' })
            .populate('restaurantId', 'cuisine');
            
        // 2. Fetch user's highly rated reviews (4 or 5 stars)
        const reviews = await Review.find({ userId, rating: { $gte: 4 } })
            .populate('restaurantId', 'cuisine');

        // Extract and count cuisines
        const cuisineFreq = {};
        const visitedRestaurantIds = new Set();

        const processItems = (items) => {
            items.forEach(item => {
                if (item.restaurantId && item.restaurantId._id) {
                    visitedRestaurantIds.add(item.restaurantId._id.toString());
                    const cuisine = item.restaurantId.cuisine;
                    if (cuisine) {
                        cuisineFreq[cuisine] = (cuisineFreq[cuisine] || 0) + 1;
                    }
                }
            });
        };

        processItems(reservations);
        processItems(reviews);

        // Sort cuisines by frequency
        const sortedCuisines = Object.keys(cuisineFreq).sort((a, b) => cuisineFreq[b] - cuisineFreq[a]);
        const topCuisines = sortedCuisines.slice(0, 2);

        let filter = { isApproved: true, subscriptionStatus: 'active' };
        
        if (topCuisines.length > 0) {
            // Include restaurants matching top cuisines, excluding already visited if possible
            filter.cuisine = { $in: topCuisines.map(c => new RegExp(c.trim(), 'i')) };
            filter._id = { $nin: Array.from(visitedRestaurantIds) };
        }

        // Fetch top rated matching restaurants
        let results = await Restaurant.find(filter).sort({ rating: -1 }).limit(4);

        // Fallback: If no history or not enough matches, fetch generic top-rated
        if (results.length < 4) {
            const fallbackFilter = { isApproved: true, subscriptionStatus: 'active', _id: { $nin: results.map(r => r._id) } };
            const fallbacks = await Restaurant.find(fallbackFilter).sort({ rating: -1 }).limit(4 - results.length);
            results = [...results, ...fallbacks];
        }

        return results;
    }
}

module.exports = new UserService();
