import mongoose from 'mongoose';
import { DELIVERY_STATUS } from '../config/constants.js';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: String,
    mobile: String,
    email: String,
    aadhaarNumber: { type: String, select: false },
    panNumber: { type: String, select: false },
    drivingLicense: { type: String, select: false },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'cycle', 'car'], default: 'bike' },
    vehicleNumber: String,
    bank: { accountName: String, accountNumber: { type: String, select: false }, ifsc: String },
    status: { type: String, enum: DELIVERY_STATUS, default: 'applied', index: true },
    isOnline: { type: Boolean, default: false },
    currentLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },
    rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    earnings: { today: { type: Number, default: 0 }, week: { type: Number, default: 0 }, month: { type: Number, default: 0 }, lifetime: { type: Number, default: 0 } },
    approvedAt: Date,
  },
  { timestamps: true }
);
deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
export default mongoose.model('DeliveryPartner', deliveryPartnerSchema);
