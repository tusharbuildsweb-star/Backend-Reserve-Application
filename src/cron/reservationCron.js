const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const reservationService = require('../services/reservationService');
const NotificationService = require('../services/notificationService');

// ─── Every minute: auto-complete expired reservations ─────────────────────────
cron.schedule('* * * * *', async () => {
    try {
        await reservationService.autoCompleteReservations();
    } catch (error) {
        console.error('Error in auto-complete cron job:', error);
    }
});

// ─── Every hour: send 1-hour reservation reminders ───────────────────────────
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
        const inOneHour15 = new Date(now.getTime() + 75 * 60 * 1000);

        // Find confirmed reservations whose bookingDateTime is ~60 min away
        // and that haven't been reminded yet
        const upcoming = await Reservation.find({
            status: 'confirmed',
            bookingDateTime: { $gte: inOneHour, $lte: inOneHour15 },
            reminderSent: { $ne: true }
        }).populate('restaurantId', 'name').populate('userId', 'name email');

        for (const reservation of upcoming) {
            try {
                const user = reservation.userId;
                const restaurant = reservation.restaurantId;
                if (user && restaurant) {
                    await NotificationService.notifyReservationReminder(reservation, restaurant, user);
                    // Mark so we don't send it twice
                    await Reservation.findByIdAndUpdate(reservation._id, { reminderSent: true });
                }
            } catch (err) {
                console.error(`Reminder error for reservation ${reservation._id}:`, err);
            }
        }

        if (upcoming.length > 0) {
            console.log(`[CRON] Sent ${upcoming.length} reservation reminder(s)`);
        }
    } catch (error) {
        console.error('Error in reservation reminder cron:', error);
    }
});

// ─── Daily at 9 AM: subscription expiry alerts (owners) ──────────────────────
cron.schedule('0 9 * * *', async () => {
    try {
        const in3Days = new Date();
        in3Days.setDate(in3Days.getDate() + 3);
        const in4Days = new Date();
        in4Days.setDate(in4Days.getDate() + 4);

        const expiringRestaurants = await Restaurant.find({
            subscriptionExpiry: { $gte: in3Days, $lt: in4Days }
        }).populate('ownerId', 'name email');

        for (const restaurant of expiringRestaurants) {
            const owner = restaurant.ownerId;
            if (!owner) continue;
            try {
                await NotificationService.createNotification(
                    owner._id,
                    '⚠️ Subscription Expiring in 3 Days',
                    `Your subscription for ${restaurant.name} expires in 3 days. Renew now to keep your listing active.`,
                    'subscription', 'owner', '/dashboard/owner'
                );
                // Email
                const { sendEmail: se } = require('../utils/sendEmail');
            } catch (err) {
                console.error(`Subscription expiry notification error for ${restaurant._id}:`, err);
            }
        }

        if (expiringRestaurants.length > 0) {
            console.log(`[CRON] Sent ${expiringRestaurants.length} subscription expiry alert(s)`);
        }
    } catch (error) {
        console.error('Error in subscription expiry cron:', error);
    }
});
