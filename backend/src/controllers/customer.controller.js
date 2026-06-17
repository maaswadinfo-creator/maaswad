import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import CateringOrder from '../models/CateringOrder.js';

// ---- Addresses ----
export const listAddresses = asyncHandler(async (req, res) => ok(res, await Address.find({ user: req.user._id })));
export const addAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
  created(res, await Address.create({ ...req.body, user: req.user._id }));
});
export const updateAddress = asyncHandler(async (req, res) => {
  const a = await Address.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  if (!a) throw ApiError.notFound('Address not found');
  ok(res, a);
});
export const deleteAddress = asyncHandler(async (req, res) => {
  await Address.deleteOne({ _id: req.params.id, user: req.user._id });
  ok(res, null, 'Deleted');
});

// ---- Notifications ----
export const listNotifications = asyncHandler(async (req, res) =>
  ok(res, await Notification.find({ user: req.user._id }).sort('-createdAt').limit(100)));
export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  ok(res, null, 'Marked read');
});
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  ok(res, null, 'All marked read');
});
export const registerFcmToken = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $addToSet: { fcmTokens: req.body.token } });
  ok(res, null, 'Token registered');
});

// ---- Coupons ----
export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.notFound('Invalid coupon');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon expired');
  ok(res, coupon);
});

// ---- Favorites & loyalty ----
export const myProfile = asyncHandler(async (req, res) =>
  ok(res, { loyaltyPoints: req.user.loyaltyPoints, walletBalance: req.user.walletBalance, referralCode: req.user.referralCode }));

// ---- Subscriptions ----
export const createSubscription = asyncHandler(async (req, res) =>
  created(res, await Subscription.create({ ...req.body, customer: req.user._id })));
export const mySubscriptions = asyncHandler(async (req, res) =>
  ok(res, await Subscription.find({ customer: req.user._id }).populate('dish chef')));
export const pauseSubscription = asyncHandler(async (req, res) => {
  const s = await Subscription.findOneAndUpdate({ _id: req.params.id, customer: req.user._id }, { status: 'paused' }, { new: true });
  if (!s) throw ApiError.notFound('Subscription not found');
  ok(res, s, 'Paused');
});
export const resumeSubscription = asyncHandler(async (req, res) => {
  const s = await Subscription.findOneAndUpdate({ _id: req.params.id, customer: req.user._id }, { status: 'active' }, { new: true });
  ok(res, s, 'Resumed');
});

// ---- Catering ----
export const requestCatering = asyncHandler(async (req, res) =>
  created(res, await CateringOrder.create({ ...req.body, customer: req.user._id }), 'Catering request submitted'));
export const myCatering = asyncHandler(async (req, res) =>
  ok(res, await CateringOrder.find({ customer: req.user._id }).sort('-createdAt')));
