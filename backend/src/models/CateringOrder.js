import mongoose from 'mongoose';
const cateringSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef' },
    eventType: { type: String, enum: ['birthday', 'office', 'family_function', 'festival', 'other'], default: 'other' },
    eventDate: Date,
    guests: Number,
    menuRequest: String,
    quotedAmount: Number,
    status: { type: String, enum: ['requested', 'quoted', 'confirmed', 'completed', 'cancelled'], default: 'requested' },
    notes: String,
  },
  { timestamps: true }
);
export default mongoose.model('CateringOrder', cateringSchema);
