import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';
// Fire-and-forget audit logging helper.
export const writeAudit = async (req, action, entity, entityId, meta = {}) => {
  try {
    await AuditLog.create({
      actor: req.user?._id, actorRole: req.activeRole, action, entity, entityId,
      meta, ip: req.ip,
    });
  } catch (e) { logger.warn(`audit failed: ${e.message}`); }
};
