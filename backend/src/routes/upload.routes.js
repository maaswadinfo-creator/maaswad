import { Router } from 'express';
import { getUploadSignature } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
const r = Router();
r.get('/signature', authenticate, getUploadSignature);
export default r;
