import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', index: true },
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef', index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: String,
    images: { type: [String], default: [] },
    chefReply: { text: String, at: Date },
    status: { type: String, enum: ['visible', 'hidden', 'flagged'], default: 'visible' },
  },
  { timestamps: true }
);
export default mongoose.model('Review', reviewSchema);
