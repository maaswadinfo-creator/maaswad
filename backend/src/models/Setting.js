import mongoose from 'mongoose';
// Single document holding platform-wide configurable settings.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'platform' },
    pricing: {
      hiddenMarginPct: { type: Number, default: 15 },
      chefCommissionPct: { type: Number, default: 10 },
      platformFee: { type: Number, default: 10 },
      packingChargePerDish: { type: Number, default: 20 },
      deliveryCharge: { type: Number, default: 49 },
      freeDeliveryThreshold: { type: Number, default: 1000 },
      gstPct: { type: Number, default: 5 },
    },
    loyalty: { pointsPerOrder: { type: Number, default: 10 }, pointValue: { type: Number, default: 1 } },
    referral: { customerCredit: { type: Number, default: 50 }, chefBonus: { type: Number, default: 500 } },
    content: { aboutUs: String, privacyPolicy: String, terms: String, contactUs: String, faq: Array },
    settlement: { chefReleaseHours: { type: Number, default: 24 } },
  },
  { timestamps: true }
);
export default mongoose.model('Setting', settingSchema);
