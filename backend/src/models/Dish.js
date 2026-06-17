import mongoose from 'mongoose';
import { DISH_STATUS } from '../config/constants.js';

const dishSchema = new mongoose.Schema(
  {
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeChef', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String }, // special category label
    cuisineRegion: String,
    cuisineSub: String,
    basePrice: { type: Number, required: true }, // chef base price (margin applied at order time)
    displayedPrice: { type: Number }, // cached base + hidden margin
    quantityAvailable: { type: Number, default: 0 },
    servingSize: String,
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    foodType: { type: String, enum: ['veg', 'non_veg', 'vegan', 'egg'], default: 'veg' },
    preparationTimeMins: { type: Number, default: 30 },
    images: { type: [String], default: [] },
    availableDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: DISH_STATUS, default: 'created', index: true },
    rejectionReason: String,
    isFeatured: { type: Boolean, default: false },
    rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);
dishSchema.index({ name: 'text', description: 'text', tags: 'text' });
export default mongoose.model('Dish', dishSchema);
