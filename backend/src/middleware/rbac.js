import ApiError from '../utils/ApiError.js';

// authorize(...allowedRoles) — checks the user's roles array.
export const authorize = (...allowed) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const has = req.user.roles.some((r) => allowed.includes(r));
  if (!has) return next(ApiError.forbidden('Insufficient role'));
  next();
};
