import { Router } from 'express';
import { trackPageView } from '../controllers/analytics.controller.js';
import { optionalAuth } from '../middleware/auth.js';
const r = Router();
// Public (fire-and-forget) — optionalAuth attaches req.user if a token is present
r.post('/pageview', optionalAuth, trackPageView);
export default r;
