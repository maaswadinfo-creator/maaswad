import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    provider: { type: String, default: 'dummy' }, // dummy | razorpay | upi
    providerPaymentId: String,
    providerOrderId: String,
    amount: Number,
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: PAYMENT_STATUS, default: 'pending', index: true },
    method: String,
    meta: Object,
  },
  { timestamps: true }
);
export default mongoose.model('Payment', paymentSchema);
