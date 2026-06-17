import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import HomeChef from '../models/HomeChef.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { getSettings } from '../services/settings.service.js';
import { writeAudit } from '../middleware/audit.js';

const getMyChef = async (req) => {
  const chef = await HomeChef.findOne({ user: req.user._id });
  if (!chef) throw ApiError.notFound('Chef profile not found');
  return chef;
};

// POST /chefs/apply
export const applyAsChef = asyncHandler(async (req, res) => {
  const existing = await HomeChef.findOne({ user: req.user._id });
  if (existing) throw ApiError.conflict('Application already exists');
  const chef = await HomeChef.create({ user: req.user._id, ...req.body, status: 'applied' });
  if (!req.user.roles.includes(ROLES.CHEF)) { req.user.roles.push(ROLES.CHEF); await req.user.save(); }
  await writeAudit(req, 'chef.apply', 'HomeChef', chef._id);
  created(res, chef, 'Application submitted');
});

// GET /chefs/me
export const myChefProfile = asyncHandler(async (req, res) => ok(res, await getMyChef(req)));

// PATCH /chefs/me
export const updateMyChefProfile = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  const allowed = ['profilePhoto', 'kitchenPhotos', 'cuisineSpecialization', 'deliveryRadiusKm', 'availableTimings', 'vacationMode', 'dailyOrderLimit', 'availabilityCalendar', 'location'];
  allowed.forEach((k) => { if (k in req.body) chef[k] = req.body[k]; });
  await chef.save();
  ok(res, chef, 'Profile updated');
});

// GET /chefs/dashboard
export const chefDashboard = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const [dailySales, monthlyRevenue, pending, active, settlements] = await Promise.all([
    Order.aggregate([{ $match: { chef: chef._id, createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$pricing.chefReceives' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { chef: chef._id, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$pricing.chefReceives' } } }]),
    Order.countDocuments({ chef: chef._id, status: { $in: ['created', 'chef_notified'] } }),
    Order.countDocuments({ chef: chef._id, status: { $in: ['chef_accepted', 'preparing', 'ready'] } }),
    Settlement.find({ chef: chef._id }).sort('-createdAt').limit(5),
  ]);
  ok(res, {
    dailySales: dailySales[0]?.total || 0,
    dailyOrders: dailySales[0]?.count || 0,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    pendingOrders: pending,
    activeOrders: active,
    rating: chef.rating,
    payoutStatus: settlements,
  });
});

// ---- Dish management (chef-owned) ----
export const createDish = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  if (!['approved', 'active'].includes(chef.status)) throw ApiError.forbidden('Only approved chefs can list dishes');
  const settings = await getSettings();
  const displayedPrice = Math.round(req.body.basePrice * (1 + settings.pricing.hiddenMarginPct / 100));
  const dish = await Dish.create({ ...req.body, chef: chef._id, displayedPrice, status: 'pending_approval' });
  created(res, dish, 'Dish created, pending approval');
});

export const myDishes = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  ok(res, await Dish.find({ chef: chef._id }).sort('-createdAt'));
});

export const updateDish = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  const dish = await Dish.findOne({ _id: req.params.id, chef: chef._id });
  if (!dish) throw ApiError.notFound('Dish not found');
  Object.assign(dish, req.body);
  if ('basePrice' in req.body) {
    const settings = await getSettings();
    dish.displayedPrice = Math.round(dish.basePrice * (1 + settings.pricing.hiddenMarginPct / 100));
    dish.status = 'pending_approval';
  }
  await dish.save();
  ok(res, dish, 'Dish updated');
});

export const deleteDish = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  const dish = await Dish.findOneAndDelete({ _id: req.params.id, chef: chef._id });
  if (!dish) throw ApiError.notFound('Dish not found');
  ok(res, null, 'Dish deleted');
});

export const toggleDish = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  const dish = await Dish.findOne({ _id: req.params.id, chef: chef._id });
  if (!dish) throw ApiError.notFound('Dish not found');
  if (dish.status === 'published') dish.status = 'paused';
  else if (dish.status === 'paused') dish.status = 'published';
  else throw ApiError.badRequest('Only published/paused dishes can be toggled');
  await dish.save();
  ok(res, dish, `Dish ${dish.status}`);
});

// GET /chefs/settlements
export const myChefSettlements = asyncHandler(async (req, res) => {
  const chef = await getMyChef(req);
  ok(res, await Settlement.find({ chef: chef._id }).sort('-createdAt'));
});
