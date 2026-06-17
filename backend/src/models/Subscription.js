import mongoose from 'mongoose';
const subscriptionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef' },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    plan: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    startDate: Date,
    endDate: Date,
    deliveryAddress: Object,
    status: { type: String, enum: ['active', 'paused', 'cancelled', 'completed'], default: 'active' },
    pausedDates: { type: [String], default: [] },
    price: Number,
  },
  { timestamps: true }
);
export default mongoose.model('Subscription', subscriptionSchema);
