import mongoose from 'mongoose';

// Lightweight page-view tracker. Frontend fires POST /analytics/pageview on each route change.
const pageViewSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, index: true },
    userAgent: String,
    referrer: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = anonymous
    sessionId: String, // random ID from localStorage to de-dup uniques
    country: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.model('PageView', pageViewSchema);
