const mongoose = require('mongoose');

const promotionPackageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    weight: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PromotionPackage', promotionPackageSchema);
