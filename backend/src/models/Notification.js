import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: String,
    body: String,
    type: { type: String, default: 'general' }, // order, payout, promo, system
    channel: { type: String, enum: ['in_app', 'push', 'email'], default: 'in_app' },
    data: Object,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model('Notification', notificationSchema);
