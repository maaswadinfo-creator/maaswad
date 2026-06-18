import mongoose from 'mongoose';
// Registry of valid chef certificate numbers, maintained by the Super Admin.
const certificateSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true, uppercase: true, trim: true, required: true },
    holderName: String,
    note: String,
    status: { type: String, enum: ['available', 'claimed'], default: 'available', index: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef' },
  },
  { timestamps: true }
);
export default mongoose.model('Certificate', certificateSchema);
