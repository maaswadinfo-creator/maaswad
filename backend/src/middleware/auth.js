import { verifyAccess } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing access token');
    const payload = verifyAccess(token);
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User not found');
    if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');
    req.user = user;
    req.activeRole = payload.role || user.activeRole;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
};

// Optional auth: attaches user if token present, never blocks.
export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccess(header.slice(7));
    req.user = await User.findById(payload.sub);
    req.activeRole = payload.role;
  } catch { /* ignore */ }
  next();
};
