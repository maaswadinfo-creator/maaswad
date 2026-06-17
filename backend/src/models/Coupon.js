import mongoose from 'mongoose';
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, uppercase: true, required: true },
    type: { type: String, enum: ['fixed', 'percentage', 'referral'], default: 'percentage' },
    value: { type: Number, required: true },
    maxDiscount: Number,
    minOrder: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default mongoose.model('Coupon', couponSchema);
