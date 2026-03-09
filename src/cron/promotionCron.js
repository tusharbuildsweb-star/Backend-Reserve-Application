const cron = require('node-cron');
const Promotion = require('../models/Promotion');

// ─── Daily at midnight: Check and expire promotions ─────────────────────────
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const expiredPromotions = await Promotion.updateMany(
            { status: 'active', endDate: { $lt: now } },
            { $set: { status: 'expired' } }
        );
        
        if (expiredPromotions.modifiedCount > 0) {
            console.log(`[CRON] Expired ${expiredPromotions.modifiedCount} promotion(s)`);
            if (global.io) {
                global.io.emit('promotionUpdated');
                global.io.emit('globalUpdate');
            }
        }
    } catch (error) {
        console.error('Error in promotion expiry cron job:', error);
    }
});
