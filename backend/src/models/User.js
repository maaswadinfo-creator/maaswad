import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_LIST, ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    passwordHash: { type: String, select: false },
    roles: { type: [String], enum: ROLE_LIST, default: [ROLES.CUSTOMER] },
    activeRole: { type: String, enum: ROLE_LIST, default: ROLES.CUSTOMER },
    avatar: { type: String },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    loyaltyPoints: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    firebaseUid: { type: String, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fcmTokens: { type: [String], default: [] },
    // transient OTP storage (dev). Production routes OTP via Firebase/Resend.
    otp: { code: String, expiresAt: Date, channel: String },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (pw) {
  this.passwordHash = await bcrypt.hash(pw, 10);
};
userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash || '');
};
userSchema.methods.toSafeJSON = function () {
  const o = this.toObject();
  delete o.passwordHash; delete o.otp; delete o.refreshTokens; delete o.__v;
  return o;
};

export default mongoose.model('User', userSchema);
