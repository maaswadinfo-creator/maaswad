import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/token.js';
import { generateOtp, otpExpiry } from '../utils/otp.js';
import { notify } from '../services/notification.service.js';
import { verifyFirebaseToken } from '../services/firebase.service.js';
import { nanoid } from '../utils/id.js';

const issueTokens = async (user, role) => {
  const activeRole = role && user.roles.includes(role) ? role : user.activeRole;
  const accessToken = signAccess({ sub: user._id, role: activeRole });
  const refreshToken = signRefresh({ sub: user._id });
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.activeRole = activeRole;
  await user.save();
  return { accessToken, refreshToken, activeRole };
};

// POST /auth/otp/request  { channel:'phone'|'email', phone?, email? }
export const requestOtp = asyncHandler(async (req, res) => {
  const { channel, phone, email } = req.body;
  const query = channel === 'email' ? { email } : { phone };
  let user = await User.findOne(query);
  if (!user) {
    user = await User.create({ ...query, referralCode: nanoid(8).toUpperCase() });
  }
  const code = generateOtp();
  user.otp = { code, expiresAt: otpExpiry(10), channel };
  await user.save();
  // Production: phone -> Firebase, email -> Resend. Dev returns code.
  if (channel === 'email') {
    await notify({ user: user._id, title: 'Your Maaswad OTP', body: `Your OTP is ${code}`, channels: ['email'], data: { email } });
  }
  ok(res, { devOtp: process.env.NODE_ENV !== 'production' ? code : undefined }, 'OTP sent');
});

// POST /auth/otp/verify  { channel, phone?, email?, code, name?, referredBy? }
export const verifyOtp = asyncHandler(async (req, res) => {
  const { channel, phone, email, code, name, referredBy } = req.body;
  const query = channel === 'email' ? { email } : { phone };
  const user = await User.findOne(query);
  if (!user || !user.otp?.code) throw ApiError.badRequest('Request an OTP first');
  if (user.otp.code !== code) throw ApiError.badRequest('Invalid OTP');
  if (user.otp.expiresAt < new Date()) throw ApiError.badRequest('OTP expired');
  if (channel === 'email') user.emailVerified = true; else user.phoneVerified = true;
  if (name && !user.name) user.name = name;
  if (referredBy && !user.referredBy) {
    const ref = await User.findOne({ referralCode: referredBy.toUpperCase() });
    if (ref) user.referredBy = ref._id;
  }
  user.otp = undefined;
  const tokens = await issueTokens(user);
  created(res, { user: user.toSafeJSON(), ...tokens }, 'Verified');
});

// POST /auth/refresh { refreshToken }
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken required');
  let payload;
  try { payload = verifyRefresh(refreshToken); } catch { throw ApiError.unauthorized('Invalid refresh token'); }
  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) throw ApiError.unauthorized('Refresh token revoked');
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  const tokens = await issueTokens(user);
  ok(res, tokens, 'Token refreshed');
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id).select('+refreshTokens');
  if (user && refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
  }
  ok(res, null, 'Logged out');
});

// GET /auth/me
export const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toSafeJSON(), activeRole: req.activeRole }));

// POST /auth/switch-role { role }
export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!req.user.roles.includes(role)) throw ApiError.forbidden('Role not assigned to user');
  const tokens = await issueTokens(req.user, role);
  ok(res, tokens, `Switched to ${role}`);
});

// POST /auth/become-customer (default) — helper to add customer role
export const ensureCustomerRole = asyncHandler(async (req, res) => {
  if (!req.user.roles.includes(ROLES.CUSTOMER)) {
    req.user.roles.push(ROLES.CUSTOMER);
    await req.user.save();
  }
  ok(res, { roles: req.user.roles });
});

// POST /auth/firebase  { idToken, name?, referredBy? }
// Verifies a Firebase phone-auth ID token (real SMS OTP done on the client)
// and issues Maaswad JWTs. This is the production phone login path.
export const firebaseLogin = asyncHandler(async (req, res) => {
  const { idToken, name, referredBy } = req.body;
  if (!idToken) throw ApiError.badRequest('idToken required');
  let decoded;
  try { decoded = await verifyFirebaseToken(idToken); }
  catch { throw ApiError.unauthorized('Invalid Firebase token'); }

  const phone = decoded.phone_number;
  const email = decoded.email;
  if (!phone && !email) throw ApiError.badRequest('Firebase token missing phone/email');

  const query = phone ? { phone } : { email };
  let user = await User.findOne(query);
  if (!user) {
    user = await User.create({
      ...query,
      name,
      phoneVerified: Boolean(phone),
      emailVerified: Boolean(email),
      firebaseUid: decoded.uid,
      referralCode: nanoid(8),
    });
    if (referredBy) {
      const ref = await User.findOne({ referralCode: referredBy.toUpperCase() });
      if (ref) { user.referredBy = ref._id; await user.save(); }
    }
  } else if (!user.firebaseUid) {
    user.firebaseUid = decoded.uid;
    if (phone) user.phoneVerified = true;
    await user.save();
  }

  const tokens = await issueTokens(user);
  created(res, { user: user.toSafeJSON(), ...tokens }, 'Logged in');
});
