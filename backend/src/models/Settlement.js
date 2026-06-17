import mongoose from 'mongoose';
import { SETTLEMENT_STATUS } from '../config/constants.js';
const settlementSchema = new mongoose.Schema(
  {
    payeeType: { type: String, enum: ['chef', 'delivery_partner'], required: true },
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef' },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    grossSales: Number,
    platformCommission: Number,
    netEarnings: Number,
    period: { from: Date, to: Date },
    status: { type: String, enum: SETTLEMENT_STATUS, default: 'pending', index: true },
    payoutDate: Date,
    reference: String,
  },
  { timestamps: true }
);
export default mongoose.model('Settlement', settlementSchema);
