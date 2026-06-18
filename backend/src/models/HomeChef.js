import mongoose from 'mongoose';
import { CHEF_STATUS } from '../config/constants.js';

const homeChefSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: String,
    mobile: String,
    email: String,
    profilePhoto: String,
    aadhaarNumber: { type: String, select: false },
    panNumber: { type: String, select: false },
    address: { line1: String, city: String, state: String, pincode: String },
    kitchenAddress: { line1: String, city: String, state: String, pincode: String },
    kitchenPhotos: { type: [String], default: [] },
    bank: { accountName: String, accountNumber: { type: String, select: false }, ifsc: String },
    fssaiNumber: String,
    certificateNumber: { type: String, uppercase: true, trim: true },
    certificateUrl: String,
    certificateVerified: { type: Boolean, default: false },
    cuisineSpecialization: { type: [String], default: [] },
    deliveryRadiusKm: { type: Number, default: 5 },
    availableTimings: { type: [String], default: [] }, // e.g. ["08:00-11:00","12:00-15:00"]
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },
    status: { type: String, enum: CHEF_STATUS, default: 'applied', index: true },
    rejectionReason: String,
    rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    badges: { type: [String], default: [] }, // top_rated, featured
    vacationMode: { type: Boolean, default: false },
    dailyOrderLimit: { type: Number, default: 0 }, // 0 = unlimited
    availabilityCalendar: { type: [{ date: String, available: Boolean }], default: [] },
    totalOrders: { type: Number, default: 0 },
    reviewedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true }
);
homeChefSchema.index({ location: '2dsphere' });
export default mongoose.model('HomeChef', homeChefSchema);
