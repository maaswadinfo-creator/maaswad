import { Router } from 'express';
import * as ac from '../controllers/adminChef.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const r = Router();
r.use(authenticate);

// ── Admin Chef Profile Management (owner + ops only) ─────────────────────────
r.get('/profiles', authorize(ROLES.OWNER, ROLES.OPS), ac.listAdminChefs);
r.post('/profiles', authorize(ROLES.OWNER), ac.createAdminChef);
r.patch('/profiles/:id', authorize(ROLES.OWNER), ac.updateAdminChef);
r.delete('/profiles/:id', authorize(ROLES.OWNER), ac.deactivateAdminChef);

// ── Home Visit Scheduling (owner + ops schedule; admin_chef can view own) ─────
r.post('/visits', authorize(ROLES.OWNER, ROLES.OPS), ac.scheduleVisit);
r.get('/visits', authorize(ROLES.OWNER, ROLES.OPS, ROLES.EVAL_CHEF), ac.listVisits);
r.get('/visits/:id', authorize(ROLES.OWNER, ROLES.OPS, ROLES.EVAL_CHEF), ac.getVisit);
r.patch('/visits/:id/cancel', authorize(ROLES.OWNER, ROLES.OPS), ac.cancelVisit);

// ── Evaluation (admin_chef + owner + ops) ─────────────────────────────────────
r.patch('/visits/:id/evaluate', authorize(ROLES.OWNER, ROLES.OPS, ROLES.EVAL_CHEF), ac.submitEvaluation);

// ── Certificate (owner + ops send after evaluation) ───────────────────────────
r.post('/visits/:id/send-certificate', authorize(ROLES.OWNER, ROLES.OPS), ac.sendCertificate);

export default r;
