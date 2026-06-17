import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    type: { type: String, enum: ['cuisine_region', 'cuisine_sub', 'special'], default: 'special' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export default mongoose.model('Category', categorySchema);
