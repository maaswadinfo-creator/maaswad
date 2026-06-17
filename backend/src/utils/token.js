import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const signAccess = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires });
export const signRefresh = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires });
export const verifyAccess = (token) => jwt.verify(token, config.jwt.accessSecret);
export const verifyRefresh = (token) => jwt.verify(token, config.jwt.refreshSecret);
