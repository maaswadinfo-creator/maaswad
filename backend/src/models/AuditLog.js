import mongoose from 'mongoose';
const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    action: String,
    entity: String,
    entityId: String,
    meta: Object,
    ip: String,
  },
  { timestamps: true }
);
export default mongoose.model('AuditLog', auditSchema);
