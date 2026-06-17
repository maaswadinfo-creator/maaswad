import mongoose from 'mongoose';
import { ORDER_STATUS } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    name: String,
    basePrice: Number,
    displayedUnit: Number,
    qty: Number,
    displayedLine: Number,
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  { status: String, at: { type: Date, default: Date.now }, note: String },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef', required: true, index: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', index: true },
    items: [orderItemSchema],
    pricing: {
      chefBaseTotal: Number, displayedFoodTotal: Number, packingCharge: Number,
      deliveryCharge: Number, platformFee: Number, discounts: Number, gst: Number,
      customerTotal: Number, chefCommission: Number, chefReceives: Number,
      breakdown: Object,
    },
    deliveryAddress: {
      line1: String, city: String, state: String, pincode: String, landmark: String,
      instructions: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },
    },
    status: { type: String, enum: ORDER_STATUS, default: 'pending_payment', index: true },
    timeline: { type: [timelineSchema], default: [] },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    coupon: { code: String, discount: Number },
    loyaltyRedeemed: { type: Number, default: 0 },
    scheduledFor: { type: Date }, // for scheduled orders
    orderType: { type: String, enum: ['immediate', 'scheduled', 'subscription', 'catering'], default: 'immediate' },
    etaMinutes: Number,
    deliveredAt: Date,
    customerConfirmedAt: Date,
    settlementEligibleAt: Date,
    cancelledReason: String,
  },
  { timestamps: true }
);
export default mongoose.model('Order', orderSchema);
