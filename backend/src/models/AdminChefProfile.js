import mongoose from 'mongoose';
const { Schema, model, Types: { ObjectId } } = mongoose;

/**
 * AdminChefProfile — master chefs appointed by super admin to evaluate home chef applicants.
 * They log in via phone OTP (role: admin_chef on the User doc) and conduct home visits.
 */
const adminChefProfileSchema = new Schema({
  user:            { type: ObjectId, ref: 'User', required: true, unique: true },
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, required: true, unique: true },
  photo:           { type: String, default: null },
  bio:             { type: String, default: '' },
  specializations: { type: [String], default: [] }, // cuisines they're expert in
  isActive:        { type: Boolean, default: true },
  createdBy:       { type: ObjectId, ref: 'User' },   // super admin who created
  totalEvaluations:{ type: Number, default: 0 },
  avgRating:       { type: Number, default: 0 },      // avg of their food-quality ratings given
}, { timestamps: true, versionKey: false });

export default model('AdminChefProfile', adminChefProfileSchema);
