import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';
import HomeChef from '../models/HomeChef.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Settlement from '../models/Settlement.js';
import AuditLog from '../models/AuditLog.js';
import Certificate from '../models/Certificate.js';
import { getSettings, updateSettings } from '../services/settings.service.js';
import { processSettlementEligibility, buildChefSettlement } from '../services/settlement.service.js';
import { notify } from '../services/notification.service.js';
import { writeAudit } from '../middleware/audit.js';
import { ROLES } from '../config/constants.js';

// ===== Certificate registry (Super Admin) =====
export const listCertificates = asyncHandler(async (_req, res) =>
  ok(res, await Certificate.find().populate('claimedBy', 'fullName').sort('-createdAt')));
export const addCertificate = asyncHandler(async (req, res) => {
  const { number, holderName, note } = req.body;
  if (!number) throw ApiError.badRequest('Certificate number required');
  const cert = await Certificate.create({ number: number.toUpperCase().trim(), holderName, note });
  await writeAudit(req, 'certificate.add', 'Certificate', cert._id, { number: cert.number });
  ok(res, cert, 'Certificate added to registry');
});
export const deleteCertificate = asyncHandler(async (req, res) => {
  await Certificate.findByIdAndDelete(req.params.id);
  ok(res, null, 'Certificate removed');
});

// ===== Chef management =====
export const listChefs = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const chefs = await HomeChef.find(filter).populate('user', 'name email phone').sort('-createdAt').lean();
  // annotate each chef with whether their certificate number is in the registry
  const numbers = chefs.map((c) => (c.certificateNumber || '').toUpperCase()).filter(Boolean);
  const registry = await Certificate.find({ number: { $in: numbers } }).lean();
  const byNumber = new Map(registry.map((r) => [r.number, r]));
  const annotated = chefs.map((c) => {
    const reg = c.certificateNumber ? byNumber.get(c.certificateNumber.toUpperCase()) : null;
    return { ...c, certificateMatch: Boolean(reg), certificateRegistry: reg || null };
  });
  ok(res, annotated);
});
export const reviewChef = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // approve | reject | suspend | move_review
  const chef = await HomeChef.findById(req.params.id).populate('user', '_id');
  if (!chef) throw ApiError.notFound('Chef not found');
  const map = { approve: 'approved', reject: 'rejected', suspend: 'suspended', move_review: 'operations_review' };
  if (!map[action]) throw ApiError.badRequest('Invalid action');

  if (action === 'approve') {
    // Verify the certificate number against the registry before activating
    const reg = chef.certificateNumber
      ? await Certificate.findOne({ number: chef.certificateNumber.toUpperCase() })
      : null;
    if (!reg) throw ApiError.badRequest('Certificate number is not in the registry — cannot approve. Add it first or reject the application.');
    reg.status = 'claimed';
    reg.claimedBy = chef._id;
    await reg.save();
    chef.certificateVerified = true;
    chef.approvedAt = new Date();
    chef.status = 'active';
  } else {
    chef.status = map[action];
    if (action === 'reject') chef.rejectionReason = reason;
  }
  await chef.save();
  await writeAudit(req, `chef.${action}`, 'HomeChef', chef._id, { reason, certificate: chef.certificateNumber });
  await notify({ user: chef.user._id, title: 'Chef application update', body: `Your application is now ${chef.status}`, type: 'system', channels: ['in_app', 'email'] });
  ok(res, chef, `Chef ${chef.status}`);
});

// ===== Dish management =====
export const listDishesAdmin = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  ok(res, await Dish.find(filter).populate('chef', 'fullName').sort('-createdAt'));
});
export const reviewDish = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // approve | reject | feature | unfeature
  const dish = await Dish.findById(req.params.id);
  if (!dish) throw ApiError.notFound('Dish not found');
  if (action === 'approve') dish.status = 'published';
  else if (action === 'reject') { dish.status = 'rejected'; dish.rejectionReason = reason; }
  else if (action === 'feature') dish.isFeatured = true;
  else if (action === 'unfeature') dish.isFeatured = false;
  else throw ApiError.badRequest('Invalid action');
  await dish.save();
  await writeAudit(req, `dish.${action}`, 'Dish', dish._id);
  ok(res, dish, `Dish ${action}`);
});

// ===== Customer management =====
export const listCustomers = asyncHandler(async (req, res) =>
  ok(res, await User.find({ roles: ROLES.CUSTOMER }).select('name email phone status loyaltyPoints createdAt').sort('-createdAt').limit(500)));
export const suspendUser = asyncHandler(async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { status: req.body.status || 'suspended' }, { new: true });
  if (!u) throw ApiError.notFound('User not found');
  await writeAudit(req, 'user.status', 'User', u._id, { status: u.status });
  ok(res, u.toSafeJSON(), `User ${u.status}`);
});

// ===== Third-party dispatch (no in-house riders) =====
export const dispatchOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', '_id');
  if (!order) throw ApiError.notFound('Order not found');
  const { action } = req.body; // out_for_delivery | delivered
  if (!['out_for_delivery', 'delivered'].includes(action)) throw ApiError.badRequest('Invalid action');
  order.status = action;
  order.timeline.push({ status: action, note: 'Third-party delivery' });
  if (action === 'delivered') order.deliveredAt = new Date();
  await order.save();
  await notify({ user: order.customer._id, title: 'Delivery update', body: `Your order is ${action.replace(/_/g, ' ')}`, type: 'order', channels: ['in_app', 'push'] });
  ok(res, order, `Order ${action.replace(/_/g, ' ')}`);
});

// ===== Delivery partner management (legacy — kept for data compatibility) =====
export const listDeliveryPartners = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  ok(res, await DeliveryPartner.find(filter).populate('user', 'name email phone').sort('-createdAt'));
});
export const reviewDeliveryPartner = asyncHandler(async (req, res) => {
  const { action } = req.body; // approve | suspend | reject
  const dp = await DeliveryPartner.findById(req.params.id).populate('user', '_id');
  if (!dp) throw ApiError.notFound('Partner not found');
  const map = { approve: 'active', suspend: 'suspended', reject: 'rejected' };
  dp.status = map[action] || dp.status;
  if (action === 'approve') dp.approvedAt = new Date();
  await dp.save();
  await notify({ user: dp.user._id, title: 'Delivery application update', body: `Status: ${dp.status}`, channels: ['in_app', 'email'] });
  ok(res, dp, `Partner ${dp.status}`);
});

// ===== Order management & rider assignment =====
export const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  ok(res, await Order.find(filter).populate('chef', 'fullName').populate('customer', 'name phone').populate('deliveryPartner', 'name').sort('-createdAt').limit(500));
});
export const assignRider = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', '_id');
  if (!order) throw ApiError.notFound('Order not found');
  let riderId = req.body.deliveryPartnerId;
  if (!riderId) { // auto-assign: nearest online active partner
    const dp = await DeliveryPartner.findOne({ status: 'active', isOnline: true });
    if (!dp) throw ApiError.badRequest('No available rider');
    riderId = dp._id;
  }
  order.deliveryPartner = riderId;
  order.status = 'rider_assigned';
  order.timeline.push({ status: 'rider_assigned' });
  await order.save();
  const dp = await DeliveryPartner.findById(riderId).populate('user', '_id');
  await notify({ user: dp.user._id, title: 'New delivery assigned', body: `Order ${order.orderNumber}`, type: 'order', channels: ['in_app', 'push'] });
  ok(res, order, 'Rider assigned');
});

// ===== Coupons =====
export const listCoupons = asyncHandler(async (_req, res) => ok(res, await Coupon.find().sort('-createdAt')));
export const createCoupon = asyncHandler(async (req, res) => ok(res, await Coupon.create(req.body), 'Coupon created'));
export const updateCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  ok(res, c, 'Coupon updated');
});

// ===== Financial / settings =====
export const getPlatformSettings = asyncHandler(async (_req, res) => ok(res, await getSettings()));
export const patchPlatformSettings = asyncHandler(async (req, res) => {
  const s = await updateSettings(req.body);
  await writeAudit(req, 'settings.update', 'Setting', s._id, req.body);
  ok(res, s, 'Settings updated');
});
export const revenueDashboard = asyncHandler(async (_req, res) => {
  const agg = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'customer_confirmed', 'reviewed', 'settlement_eligible'] } } },
    { $group: { _id: null, revenue: { $sum: '$pricing.breakdown.platformRevenue' }, gmv: { $sum: '$pricing.customerTotal' }, orders: { $sum: 1 } } },
  ]);
  const counts = await Promise.all([
    User.countDocuments({ roles: ROLES.CUSTOMER }),
    HomeChef.countDocuments({ status: 'active' }),
    DeliveryPartner.countDocuments({ status: 'active' }),
  ]);
  ok(res, {
    platformRevenue: agg[0]?.revenue || 0,
    gmv: agg[0]?.gmv || 0,
    totalOrders: agg[0]?.orders || 0,
    customers: counts[0], activeChefs: counts[1], activeRiders: counts[2],
  });
});

// ===== Settlements =====
export const runSettlements = asyncHandler(async (_req, res) => {
  const count = await processSettlementEligibility();
  ok(res, { eligible: count }, `${count} orders now settlement-eligible`);
});
export const generateChefSettlement = asyncHandler(async (req, res) => {
  const { chefId, from, to } = req.body;
  const s = await buildChefSettlement(chefId, new Date(from), new Date(to));
  ok(res, s, 'Settlement generated');
});
export const listSettlements = asyncHandler(async (_req, res) => ok(res, await Settlement.find().populate('chef', 'fullName').sort('-createdAt')));

// ===== Reviews moderation =====
export const moderateReview = asyncHandler(async (req, res) => {
  const r = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!r) throw ApiError.notFound('Review not found');
  ok(res, r, 'Review moderated');
});

// ===== Owner: audit logs & analytics =====
export const auditLogs = asyncHandler(async (req, res) =>
  ok(res, await AuditLog.find().populate('actor', 'name email').sort('-createdAt').limit(300)));
export const userAnalytics = asyncHandler(async (_req, res) => {
  const byRole = await User.aggregate([{ $unwind: '$roles' }, { $group: { _id: '$roles', count: { $sum: 1 } } }]);
  ok(res, { byRole });
});
