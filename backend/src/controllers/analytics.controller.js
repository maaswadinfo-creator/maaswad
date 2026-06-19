import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import PageView from '../models/PageView.js';
import User from '../models/User.js';
import HomeChef from '../models/HomeChef.js';
import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import { ROLES } from '../config/constants.js';

// POST /analytics/pageview  — called from frontend on every route change (public, fire-and-forget)
export const trackPageView = asyncHandler(async (req, res) => {
  const { path, sessionId, referrer } = req.body;
  if (!path) { res.status(200).end(); return; }
  await PageView.create({
    path,
    sessionId: sessionId || null,
    referrer: referrer || null,
    user: req.user?._id || null,
    userAgent: req.headers['user-agent'] || null,
  });
  res.status(200).end();
});

// GET /admin/analytics/overview  — full platform stats for super admin
export const platformOverview = asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOf7d = new Date(now); startOf7d.setDate(now.getDate() - 6); startOf7d.setHours(0, 0, 0, 0);
  const startOf30d = new Date(now); startOf30d.setDate(now.getDate() - 29); startOf30d.setHours(0, 0, 0, 0);

  const [
    // Users
    totalUsers,
    newUsersToday,
    newUsers7d,
    // Chefs
    totalChefs,
    activeChefs,
    pendingChefApps,
    // Orders
    ordersToday,
    orders7d,
    orders30d,
    revenueAgg,
    revenue7dAgg,
    revenue30dAgg,
    // Dishes
    totalDishes,
    // Visitors
    visitorsToday,
    visitors7d,
    uniqueVisitors7d,
    topPages,
    dailyVisitors,
    // Chef pipeline
    chefPipeline,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOf7d } }),

    HomeChef.countDocuments(),
    HomeChef.countDocuments({ status: 'active' }),
    HomeChef.countDocuments({ status: { $in: ['applied', 'under_review', 'pending_certificate', 'certificate_uploaded'] } }),

    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ createdAt: { $gte: startOf7d } }),
    Order.countDocuments({ createdAt: { $gte: startOf30d } }),

    Order.aggregate([{ $match: { status: { $in: ['delivered', 'customer_confirmed', 'reviewed', 'settlement_eligible'] } } }, { $group: { _id: null, revenue: { $sum: '$pricing.breakdown.platformRevenue' }, gmv: { $sum: '$pricing.customerTotal' } } }]),
    Order.aggregate([{ $match: { status: { $in: ['delivered', 'customer_confirmed', 'reviewed', 'settlement_eligible'] }, createdAt: { $gte: startOf7d } } }, { $group: { _id: null, revenue: { $sum: '$pricing.breakdown.platformRevenue' }, gmv: { $sum: '$pricing.customerTotal' } } }]),
    Order.aggregate([{ $match: { status: { $in: ['delivered', 'customer_confirmed', 'reviewed', 'settlement_eligible'] }, createdAt: { $gte: startOf30d } } }, { $group: { _id: null, revenue: { $sum: '$pricing.breakdown.platformRevenue' }, gmv: { $sum: '$pricing.customerTotal' } } }]),

    Dish.countDocuments({ status: 'published' }),

    PageView.countDocuments({ createdAt: { $gte: startOfToday } }),
    PageView.countDocuments({ createdAt: { $gte: startOf7d } }),
    PageView.distinct('sessionId', { createdAt: { $gte: startOf7d }, sessionId: { $ne: null } }).then((r) => r.length),

    PageView.aggregate([
      { $match: { createdAt: { $gte: startOf7d } } },
      { $group: { _id: '$path', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),

    PageView.aggregate([
      { $match: { createdAt: { $gte: startOf7d } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, views: { $sum: 1 }, unique: { $addToSet: '$sessionId' } } },
      { $project: { date: '$_id', views: 1, unique: { $size: '$unique' }, _id: 0 } },
      { $sort: { date: 1 } },
    ]),

    HomeChef.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  ok(res, {
    users: { total: totalUsers, newToday: newUsersToday, new7d: newUsers7d },
    chefs: {
      total: totalChefs,
      active: activeChefs,
      pendingApplications: pendingChefApps,
      pipeline: Object.fromEntries(chefPipeline.map((p) => [p._id, p.count])),
    },
    orders: {
      today: ordersToday,
      last7d: orders7d,
      last30d: orders30d,
    },
    revenue: {
      allTime: revenueAgg[0]?.revenue || 0,
      gmvAllTime: revenueAgg[0]?.gmv || 0,
      last7d: revenue7dAgg[0]?.revenue || 0,
      last30d: revenue30dAgg[0]?.revenue || 0,
    },
    dishes: { published: totalDishes },
    visitors: {
      today: visitorsToday,
      last7d: visitors7d,
      uniqueLast7d: uniqueVisitors7d,
      topPages,
      dailyChart: dailyVisitors,
    },
  });
});

// GET /admin/analytics/user-growth  — 30-day user signups per day
export const userGrowth = asyncHandler(async (_req, res) => {
  const startOf30d = new Date(); startOf30d.setDate(startOf30d.getDate() - 29); startOf30d.setHours(0, 0, 0, 0);
  const data = await User.aggregate([
    { $match: { createdAt: { $gte: startOf30d } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);
  ok(res, data);
});
