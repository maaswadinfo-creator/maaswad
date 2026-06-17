import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import HomeChef from '../models/HomeChef.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { computeOrderPricing } from '../services/pricing.service.js';
import { getSettings } from '../services/settings.service.js';
import { initiatePayment, confirmPayment } from '../services/payment.service.js';
import { notify } from '../services/notification.service.js';
import { estimateEtaMinutes, getDistance, geocode } from '../services/maps.service.js';
import { orderNumber } from '../utils/id.js';
import { ORDER_STATUS } from '../config/constants.js';

const advanceMap = {
  chef_accepted: ['preparing'],
  preparing: ['ready'],
};

// POST /orders/quote  { items:[{dishId, qty}], couponCode?, loyaltyRedeem? }
export const quoteOrder = asyncHandler(async (req, res) => {
  const { items, couponCode, loyaltyRedeem = 0 } = req.body;
  const { pricing } = await buildPricing(req.user, items, couponCode, loyaltyRedeem);
  ok(res, pricing);
});

async function buildPricing(user, items, couponCode, loyaltyRedeem = 0) {
  const settings = await getSettings();
  const dishes = await Dish.find({ _id: { $in: items.map((i) => i.dishId) }, status: 'published' });
  if (dishes.length !== items.length) throw ApiError.badRequest('Some dishes are unavailable');
  const chefIds = [...new Set(dishes.map((d) => String(d.chef)))];
  if (chefIds.length > 1) throw ApiError.badRequest('Order items must be from a single chef');
  const priced = items.map((i) => {
    const d = dishes.find((x) => String(x._id) === String(i.dishId));
    return { dish: d, basePrice: d.basePrice, qty: i.qty };
  });

  let couponDiscount = 0; let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw ApiError.badRequest('Invalid coupon');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon expired');
    const displayed = priced.reduce((s, p) => s + p.basePrice * (1 + settings.pricing.hiddenMarginPct / 100) * p.qty, 0);
    if (displayed < coupon.minOrder) throw ApiError.badRequest(`Minimum order ₹${coupon.minOrder} for this coupon`);
    couponDiscount = coupon.type === 'percentage' ? Math.min((displayed * coupon.value) / 100, coupon.maxDiscount || Infinity) : coupon.value;
  }
  const loyaltyDiscount = Math.min(loyaltyRedeem * (settings.loyalty.pointValue || 1), user.loyaltyPoints * (settings.loyalty.pointValue || 1));

  const pricing = computeOrderPricing(
    priced.map((p) => ({ basePrice: p.basePrice, qty: p.qty })),
    settings.pricing,
    { couponDiscount, loyaltyDiscount, applyGst: false }
  );
  return { pricing, priced, chefId: chefIds[0], coupon };
}

// POST /orders/checkout
export const checkout = asyncHandler(async (req, res) => {
  const { items, couponCode, loyaltyRedeem = 0, deliveryAddress, scheduledFor, orderType = 'immediate' } = req.body;
  const { pricing, priced, chefId, coupon } = await buildPricing(req.user, items, couponCode, loyaltyRedeem);
  const chef = await HomeChef.findById(chefId);
  if (chef.vacationMode) throw ApiError.badRequest('Chef is currently unavailable');

  // Resolve delivery coordinates: use the pin if provided, else geocode the
  // typed address via Google (server-side key). Falls back gracefully.
  const hasPin = (c) => Array.isArray(c) && (c[0] !== 0 || c[1] !== 0);
  if (deliveryAddress && !hasPin(deliveryAddress.location?.coordinates)) {
    const addr = [deliveryAddress.line1, deliveryAddress.city, deliveryAddress.state, deliveryAddress.pincode].filter(Boolean).join(', ');
    const coords = addr ? await geocode(addr) : null;
    if (coords) deliveryAddress.location = { type: 'Point', coordinates: coords };
  }

  // ETA estimate (real driving distance/time when Maps key is set)
  const prepMins = Math.max(...priced.map((p) => p.dish.preparationTimeMins || 30));
  let eta = 45;
  if (hasPin(deliveryAddress?.location?.coordinates) && hasPin(chef.location?.coordinates)) {
    const { distanceKm } = await getDistance(chef.location.coordinates, deliveryAddress.location.coordinates);
    eta = estimateEtaMinutes(distanceKm, prepMins);
  } else {
    eta = prepMins + 15;
  }

  const order = await Order.create({
    orderNumber: orderNumber(),
    customer: req.user._id,
    chef: chefId,
    items: priced.map((p, idx) => ({
      dish: p.dish._id,
      name: p.dish.name,
      basePrice: p.basePrice,
      qty: p.qty,
      displayedUnit: pricing.lines[idx].displayedUnit,
      displayedLine: pricing.lines[idx].displayedLine,
    })),
    pricing,
    deliveryAddress,
    coupon: coupon ? { code: coupon.code, discount: pricing.discounts } : undefined,
    loyaltyRedeemed: loyaltyRedeem,
    scheduledFor, orderType,
    etaMinutes: eta,
    status: 'pending_payment',
    timeline: [{ status: 'pending_payment' }],
  });

  const { payment, intent } = await initiatePayment({ order: order._id, customer: req.user._id, amount: pricing.customerTotal });
  order.payment = payment._id;
  await order.save();
  created(res, { order, payment: { id: payment._id, intent } }, 'Order created, awaiting payment');
});

// POST /orders/:id/pay  (dummy gateway confirm)
export const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate('chef');
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'pending_payment') throw ApiError.badRequest('Order already paid');
  const payment = await confirmPayment(order.payment);
  if (payment.status !== 'success') throw ApiError.badRequest('Payment failed');

  order.status = 'chef_notified';
  order.timeline.push({ status: 'paid' }, { status: 'created' }, { status: 'chef_notified' });
  await order.save();

  // loyalty + coupon usage
  const settings = await getSettings();
  if (order.loyaltyRedeemed) await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: -order.loyaltyRedeemed } });
  await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: settings.loyalty.pointsPerOrder } });
  if (order.coupon?.code) await Coupon.updateOne({ code: order.coupon.code }, { $inc: { usedCount: 1 } });

  await notify({ user: order.chef.user, title: 'New order received', body: `Order ${order.orderNumber}`, type: 'order', channels: ['in_app', 'push'] });
  ok(res, order, 'Payment successful, chef notified');
});

// GET /orders/mine
export const myOrders = asyncHandler(async (req, res) => {
  ok(res, await Order.find({ customer: req.user._id }).sort('-createdAt').populate('chef', 'fullName'));
});

// GET /orders/:id
export const orderDetail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('chef', 'fullName').populate('deliveryPartner', 'name mobile currentLocation');
  if (!order) throw ApiError.notFound('Order not found');
  ok(res, order);
});

// chef order queue
export const chefOrders = asyncHandler(async (req, res) => {
  const chef = await HomeChef.findOne({ user: req.user._id });
  if (!chef) throw ApiError.notFound('Chef profile not found');
  const filter = { chef: chef._id };
  if (req.query.status) filter.status = req.query.status;
  ok(res, await Order.find(filter).sort('-createdAt').populate('customer', 'name phone'));
});

// PATCH /orders/:id/chef-status  { action: 'accept'|'reject'|'preparing'|'ready' }
export const chefUpdateStatus = asyncHandler(async (req, res) => {
  const chef = await HomeChef.findOne({ user: req.user._id });
  const order = await Order.findOne({ _id: req.params.id, chef: chef._id }).populate('customer', '_id');
  if (!order) throw ApiError.notFound('Order not found');
  const { action } = req.body;
  if (action === 'accept') order.status = 'chef_accepted';
  else if (action === 'reject') { order.status = 'rejected'; order.cancelledReason = req.body.reason; }
  else if (action === 'preparing') order.status = 'preparing';
  else if (action === 'ready') order.status = 'ready';
  else throw ApiError.badRequest('Invalid action');
  order.timeline.push({ status: order.status });
  await order.save();
  await notify({ user: order.customer._id, title: 'Order update', body: `Your order is ${order.status}`, type: 'order', channels: ['in_app', 'push'] });
  ok(res, order, `Order ${order.status}`);
});

// POST /orders/:id/confirm  (customer confirms delivery)
export const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'delivered') throw ApiError.badRequest('Order not delivered yet');
  order.status = 'customer_confirmed';
  order.customerConfirmedAt = new Date();
  order.timeline.push({ status: 'customer_confirmed' });
  await order.save();
  ok(res, order, 'Delivery confirmed');
});

// POST /orders/:id/reorder
export const reorder = asyncHandler(async (req, res) => {
  const prev = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!prev) throw ApiError.notFound('Order not found');
  ok(res, { items: prev.items.map((i) => ({ dishId: i.dish, qty: i.qty })), chef: prev.chef }, 'Reorder payload');
});
