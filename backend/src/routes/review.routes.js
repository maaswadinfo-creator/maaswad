import { Router } from 'express';
import * as rv from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
const r = Router();
r.get('/dish/:dishId', rv.dishReviews);
r.post('/', authenticate, rv.createReview);
export default r;
