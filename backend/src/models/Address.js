import mongoose from 'mongoose';
const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    label: { type: String, default: 'Home' },
    line1: String, line2: String, city: String, state: String, pincode: String,
    landmark: String,
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);
addressSchema.index({ location: '2dsphere' });
export default mongoose.model('Address', addressSchema);
