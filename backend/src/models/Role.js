import mongoose from 'mongoose';
const roleSchema = new mongoose.Schema(
  { key: { type: String, unique: true }, name: String, permissions: { type: [String], default: [] } },
  { timestamps: true }
);
export default mongoose.model('Role', roleSchema);
