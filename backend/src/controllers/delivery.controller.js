import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';
import { ROLES } from '../config/constants.js';
import { notify } from '../services/notification.service.js';

const getMe = async (req) => {
  const dp = await DeliveryPartner.findOne({ user: req.user._id });
  if (!dp) throw ApiError.notFound('Delivery partner profile not found');
  return dp;
};

// POST /delivery/apply
export const applyAsDelivery = asyncHandler(async (req, res) => {
  const existing = await DeliveryPartner.findOne({ user: req.user._id });
  if (existing) throw ApiError.conflict('Application already exists');
  const dp = await DeliveryPartner.create({ user: req.user._id, ...req.body, status: 'applied' });
  if (!req.user.roles.includes(ROLES.DELIVERY)) { req.user.roles.push(ROLES.DELIVERY); await req.user.save(); }
  created(res, dp, 'Application submitted');
});

// PATCH /delivery/availability { isOnline }
export const setAvailability = asyncHandler(async (req, res) => {
  const dp = await getMe(req);
  dp.isOnline = !!req.body.isOnline;
  if (req.body.location) dp.currentLocation = { type: 'Point', coordinates: req.body.location };
  await dp.save();
  ok(res, { isOnline: dp.isOnline }, dp.isOnline ? 'You are online' : 'You are offline');
});

// GET /delivery/assigned
export const assignedOrders = asyncHandler(async (req, res) => {
  const dp = await getMe(req);
  ok(res, await Order.find({ deliveryPartner: dp._id, status: { $in: ['rider_assigned', 'pickup_started', 'picked_up', 'out_for_delivery'] } }).populate('chef', 'fullName kitchenAddress').populate('customer', 'name phone'));
});

// PATCH /delivery/orders/:id/status { action: pickup_started|picked_up|out_for_delivery|delivered }
export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const dp = await getMe(req);
  const order = await Order.findOne({ _id: req.params.id, deliveryPartner: dp._id }).populate('customer', '_id');
  if (!order) throw ApiError.notFound('Order not found');
  const flow = ['pickup_started', 'picked_up', 'out_for_delivery', 'delivered'];
  if (!flow.includes(req.body.action)) throw ApiError.badRequest('Invalid action');
  order.status = req.body.action;
  order.timeline.push({ status: order.status });
  if (order.status === 'delivered') order.deliveredAt = new Date();
  await order.save();
  await notify({ user: order.customer._id, title: 'Delivery update', body: `Your order is ${order.status}`, type: 'order', channels: ['in_app', 'push'] });
  ok(res, order, `Order ${order.status}`);
});

// GET /delivery/earnings
export const earnings = asyncHandler(async (req, res) => {
  const dp = await getMe(req);
  ok(res, dp.earnings);
});

// GET /delivery/history
export const deliveryHistory = asyncHandler(async (req, res) => {
  const dp = await getMe(req);
  ok(res, await Order.find({ deliveryPartner: dp._id, status: { $in: ['delivered', 'customer_confirmed', 'reviewed', 'settlement_eligible'] } }).sort('-deliveredAt').limit(100));
});
