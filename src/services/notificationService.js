const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ─── Email HTML Templates ──────────────────────────────────────────────────────

const emailTemplates = {
    bookingConfirmed: ({ userName, restaurantName, date, time, guests, bookingId }) => ({
        subject: `✅ Reservation Confirmed – ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#d4af37,#f59e0b);padding:36px;text-align:center;color:#000;">
                <h1 style="margin:0;font-size:26px;">🎉 Your Table is Confirmed!</h1>
                <p style="margin:10px 0 0;opacity:0.8;font-size:14px;">Booking #${String(bookingId).slice(-6).toUpperCase()}</p>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">Your reservation at <strong>${restaurantName}</strong> is confirmed. We look forward to serving you!</p>
                <div style="background:#f8fafc;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #d4af37;">
                    <p style="margin:0 0 10px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Booking Details</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">📅 <strong>Date:</strong> ${date}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">⏰ <strong>Time:</strong> ${time}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">👥 <strong>Guests:</strong> ${guests}</p>
                </div>
                <p style="font-size:13px;color:#94a3b8;">Need to cancel? Visit your dashboard at least 5 hours before your reservation for a full refund.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    ownerNewBooking: ({ ownerName, restaurantName, userName, date, time, guests, bookingId }) => ({
        subject: `📋 New Reservation at ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:36px;text-align:center;color:#d4af37;">
                <h1 style="margin:0;font-size:24px;">New Reservation Received</h1>
                <p style="margin:10px 0 0;opacity:0.7;font-size:13px;color:#fff;">Booking #${String(bookingId).slice(-6).toUpperCase()}</p>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${ownerName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">A new reservation has been made at <strong>${restaurantName}</strong>.</p>
                <div style="background:#f8fafc;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #1e293b;">
                    <p style="margin:0 0 10px;color:#64748b;font-size:12px;text-transform:uppercase;">Guest Details</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">👤 <strong>Guest:</strong> ${userName}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">📅 <strong>Date:</strong> ${date}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">⏰ <strong>Time:</strong> ${time}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">👥 <strong>Guests:</strong> ${guests}</p>
                </div>
                <p style="font-size:13px;color:#94a3b8;">Log into your Owner Dashboard to view full booking details.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    bookingCancelledUser: ({ userName, restaurantName, date, time, refundAmount, bookingId }) => ({
        subject: `❌ Reservation Cancelled – ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#ef4444;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">Reservation Cancelled</h1>
                <p style="margin:10px 0 0;opacity:0.85;font-size:13px;">Booking #${String(bookingId).slice(-6).toUpperCase()}</p>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">Your reservation at <strong>${restaurantName}</strong> on <strong>${date} at ${time}</strong> has been successfully cancelled.</p>
                <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #ef4444;">
                    <p style="margin:0;font-size:15px;color:#1e293b;"><strong>Refund Amount:</strong> ₹${refundAmount}</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Refunds are credited to your original payment method within 5–7 business days.</p>
                </div>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    ownerBookingCancelled: ({ ownerName, restaurantName, userName, date, time, guests, bookingId }) => ({
        subject: `⚠️ Reservation Cancelled at ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#f59e0b;padding:36px;text-align:center;color:#000;">
                <h1 style="margin:0;font-size:24px;">Reservation Cancelled by Guest</h1>
                <p style="margin:10px 0 0;opacity:0.7;font-size:13px;">Booking #${String(bookingId).slice(-6).toUpperCase()}</p>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${ownerName}</strong>,</p>
                <p style="font-size:15px;color:#475569;"><strong>${userName}</strong> has cancelled their reservation at <strong>${restaurantName}</strong>.</p>
                <div style="background:#fffbeb;border-radius:8px;padding:24px;margin:20px 0;border-left:4px solid #f59e0b;">
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">📅 <strong>Date:</strong> ${date}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">⏰ <strong>Time:</strong> ${time}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">👥 <strong>Guests:</strong> ${guests}</p>
                </div>
                <p style="font-size:13px;color:#94a3b8;">The time slot has been freed up and waitlisted guests have been notified.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    ownerReplied: ({ userName, restaurantName, replyText }) => ({
        subject: `💬 Owner Replied to Your Review – ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#7c3aed;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">The owner replied to your review!</h1>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">The owner of <strong>${restaurantName}</strong> has responded to your review:</p>
                <div style="background:#f5f3ff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #7c3aed;font-style:italic;color:#1e293b;">
                    "${replyText}"
                </div>
                <p style="font-size:13px;color:#94a3b8;">Visit your dashboard to see the full review thread.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    reviewPosted: ({ ownerName, restaurantName, userName, rating, comment }) => ({
        subject: `⭐ New Review on ${restaurantName}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#10b981;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">New Review Posted</h1>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${ownerName}</strong>,</p>
                <p style="font-size:15px;color:#475569;"><strong>${userName}</strong> left a <strong>${rating}⭐</strong> review on <strong>${restaurantName}</strong>.</p>
                <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #10b981;font-style:italic;color:#1e293b;">
                    "${comment}"
                </div>
                <p style="font-size:13px;color:#94a3b8;">Log in to your Owner Dashboard to respond.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    reservationReminder: ({ userName, restaurantName, date, time, guests }) => ({
        subject: `⏰ Reminder: Your reservation at ${restaurantName} is in 1 hour!`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#3b82f6;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">⏰ Your Reservation is in 1 Hour!</h1>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">Your reservation at <strong>${restaurantName}</strong> starts soon!</p>
                <div style="background:#eff6ff;border-radius:8px;padding:24px;margin:20px 0;border-left:4px solid #3b82f6;">
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">📅 <strong>Date:</strong> ${date}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">⏰ <strong>Time:</strong> ${time}</p>
                    <p style="margin:6px 0;font-size:15px;color:#1e293b;">👥 <strong>Guests:</strong> ${guests}</p>
                </div>
                <p style="font-size:13px;color:#94a3b8;">Please arrive on time. Enjoy your dining experience!</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    paymentSuccess: ({ userName, restaurantName, amount, bookingId }) => ({
        subject: `💳 Payment Confirmed – ₹${amount}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#16a34a;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">Payment Successful!</h1>
                <p style="margin:10px 0 0;opacity:0.85;font-size:13px;">Booking #${String(bookingId).slice(-6).toUpperCase()}</p>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size:15px;color:#475569;">Your payment of <strong>₹${amount}</strong> for <strong>${restaurantName}</strong> was successful.</p>
                <p style="font-size:13px;color:#94a3b8;">Your booking is confirmed and a receipt has been saved to your dashboard.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),

    sendGenericEmail: ({ userName, subject, message, linkUrl, linkText }) => ({
        subject: subject,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1e293b;padding:36px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:24px;">${subject}</h1>
            </div>
            <div style="padding:36px;background:#fff;">
                <p style="font-size:16px;color:#1e293b;">Hello <strong>${userName || 'User'}</strong>,</p>
                <p style="font-size:15px;color:#475569;">${message}</p>
                ${linkUrl ? `<div style="text-align:center;margin:30px 0;"><a href="${linkUrl}" style="background:#d4af37;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">${linkText || 'View Details'}</a></div>` : ''}
                <p style="font-size:13px;color:#94a3b8;">Thank you for using our platform.</p>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">RESERVE – Premium Dining Platform</div>
        </div>`
    }),
};

// ─── Core Service ──────────────────────────────────────────────────────────────

class NotificationService {

    /**
     * Create in-app notification + emit targeted Socket.io event + optionally send email
     * @param {string} userId - recipient user ID
     * @param {string} title
     * @param {string} message
     * @param {string} type - reservation | payment | system | support | subscription | review
     * @param {string} role - user | owner | admin
     * @param {string} link
     * @param {boolean} sendEmailFlag - if true, also sends the generic email template
     */
    async createNotification(userId, title, message, type = 'system', role = 'user', link = '', sendEmailFlag = false) {
        try {
            // Null user id checks for global admin broadcasts
            if (!userId) return;

            const notification = new Notification({ userId, title, message, type, role, link, read: false });
            await notification.save();

            // Targeted emit — only the intended user receives it
            if (global.io) {
                global.io.to(`user_${userId}`).emit('notification', notification);
                // Also broadcast a generic globalUpdate for dashboards listening to it
                global.io.emit('globalUpdate', { type: 'notification', userId, role });
            }

            if (sendEmailFlag) {
                const user = await User.findById(userId);
                if (user && user.email) {
                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const fullLink = link.startsWith('http') ? link : baseUrl + link;
                    const tmpl = emailTemplates.sendGenericEmail({ 
                        userName: user.name, 
                        subject: title, 
                        message: message, 
                        linkUrl: link ? fullLink : '',
                        linkText: 'View in Dashboard'
                    });
                    sendEmail({ to: user.email, ...tmpl }).catch(console.error);
                }
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    // ─── Specific Event Helpers ──────────────────────────────────────────────────

    async notifyBookingConfirmed(reservation, restaurant, user) {
        const dateStr = new Date(reservation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
        // In-app: user
        await this.createNotification(
            user._id, 'Reservation Confirmed 🎉',
            `Your table at ${restaurant.name} on ${dateStr} at ${reservation.time} is confirmed.`,
            'reservation', 'user', '/dashboard/user'
        );
        // Email: user
        const tmpl = emailTemplates.bookingConfirmed({ userName: user.name, restaurantName: restaurant.name, date: dateStr, time: reservation.time, guests: reservation.guests, bookingId: reservation._id });
        sendEmail({ to: user.email, ...tmpl }).catch(console.error);

        // In-app: owner
        const owner = await User.findById(restaurant.ownerId);
        if (owner) {
            await this.createNotification(
                owner._id, `New Booking at ${restaurant.name}`,
                `${user.name} booked a table for ${reservation.guests} guests on ${dateStr} at ${reservation.time}.`,
                'reservation', 'owner', '/dashboard/owner'
            );
            // Email: owner
            const ownerTmpl = emailTemplates.ownerNewBooking({ ownerName: owner.name, restaurantName: restaurant.name, userName: user.name, date: dateStr, time: reservation.time, guests: reservation.guests, bookingId: reservation._id });
            sendEmail({ to: owner.email, ...ownerTmpl }).catch(console.error);
        }
    }

    async notifyBookingCancelled(reservation, restaurant, cancellerUser, refundAmount = 0) {
        const dateStr = new Date(reservation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
        const userId = reservation.userId;

        // In-app: user
        await this.createNotification(
            userId, 'Reservation Cancelled',
            `Your reservation at ${restaurant.name} on ${dateStr} has been cancelled. ${refundAmount > 0 ? `Refund of ₹${refundAmount} will be processed in 5-7 days.` : 'No refund applies per late cancellation policy.'}`,
            'reservation', 'user', '/dashboard/user'
        );
        // Email: user
        const userObj = await User.findById(userId);
        if (userObj) {
            const tmpl = emailTemplates.bookingCancelledUser({ userName: userObj.name, restaurantName: restaurant.name, date: dateStr, time: reservation.time, refundAmount, bookingId: reservation._id });
            sendEmail({ to: userObj.email, ...tmpl }).catch(console.error);
        }

        // In-app: owner
        const owner = await User.findById(restaurant.ownerId);
        if (owner) {
            await this.createNotification(
                owner._id, `Reservation Cancelled – ${restaurant.name}`,
                `${cancellerUser?.name || 'A guest'} cancelled their reservation for ${reservation.guests} guests on ${dateStr} at ${reservation.time}.`,
                'reservation', 'owner', '/dashboard/owner'
            );
            // Email: owner
            const ownerTmpl = emailTemplates.ownerBookingCancelled({ ownerName: owner.name, restaurantName: restaurant.name, userName: cancellerUser?.name || 'Guest', date: dateStr, time: reservation.time, guests: reservation.guests, bookingId: reservation._id });
            sendEmail({ to: owner.email, ...ownerTmpl }).catch(console.error);
        }
    }

    async notifyOwnerReviewPosted(review, restaurant, reviewer) {
        const owner = await User.findById(restaurant.ownerId);
        if (!owner) return;
        await this.createNotification(
            owner._id, `New ⭐${review.rating} Review`,
            `${reviewer.name} left a ${review.rating}-star review on ${restaurant.name}.`,
            'reservation', 'owner', '/dashboard/owner'
        );
        const tmpl = emailTemplates.reviewPosted({ ownerName: owner.name, restaurantName: restaurant.name, userName: reviewer.name, rating: review.rating, comment: review.comment });
        sendEmail({ to: owner.email, ...tmpl }).catch(console.error);
    }

    async notifyUserOwnerReplied(review, restaurant, reviewerUser) {
        if (!reviewerUser) return;
        await this.createNotification(
            reviewerUser._id, `Owner replied to your review`,
            `${restaurant.name} responded to your review.`,
            'reservation', 'user', '/dashboard/user'
        );
        const tmpl = emailTemplates.ownerReplied({ userName: reviewerUser.name, restaurantName: restaurant.name, replyText: review.ownerReply });
        sendEmail({ to: reviewerUser.email, ...tmpl }).catch(console.error);
    }

    async notifyPaymentSuccess(reservation, restaurant, user) {
        await this.createNotification(
            user._id, 'Payment Confirmed 💳',
            `Your payment of ₹${reservation.totalPaidNow} for ${restaurant.name} was successful.`,
            'payment', 'user', '/dashboard/user'
        );
        const tmpl = emailTemplates.paymentSuccess({ userName: user.name, restaurantName: restaurant.name, amount: reservation.totalPaidNow, bookingId: reservation._id });
        sendEmail({ to: user.email, ...tmpl }).catch(console.error);
    }

    async notifyReservationReminder(reservation, restaurant, user) {
        const dateStr = new Date(reservation.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        await this.createNotification(
            user._id, '⏰ Reservation in 1 Hour!',
            `Your reservation at ${restaurant.name} starts at ${reservation.time}. Get ready!`,
            'reservation', 'user', '/dashboard/user'
        );
        const tmpl = emailTemplates.reservationReminder({ userName: user.name, restaurantName: restaurant.name, date: dateStr, time: reservation.time, guests: reservation.guests });
        sendEmail({ to: user.email, ...tmpl }).catch(console.error);
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    async getUserNotifications(userId) {
        return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    }

    async getUnreadCount(userId) {
        return await Notification.countDocuments({ userId, read: false });
    }

    async markAsRead(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        return await Notification.updateMany({ userId, read: false }, { read: true });
    }

    async deleteNotification(notificationId, userId) {
        return await Notification.findOneAndDelete({ _id: notificationId, userId });
    }
}

module.exports = new NotificationService();
