import mongoose from 'mongoose';

const adminTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'done', 'cancelled'], default: 'open', index: true },
    category: { type: String, enum: ['chef_review', 'order_issue', 'customer_support', 'content', 'finance', 'operations', 'other'], default: 'other' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: Date,
    completedAt: Date,
    notes: { type: [{ body: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }], default: [] },
    // optional link to a resource (e.g. a chef application or order)
    refModel: { type: String, enum: ['HomeChef', 'Order', 'User', 'Dish', null] },
    refId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export default mongoose.model('AdminTask', adminTaskSchema);
