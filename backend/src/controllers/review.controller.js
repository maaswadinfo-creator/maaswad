import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import HomeChef from '../models/HomeChef.js';

const recalcRating = async (Model, field, id) => {
  const match = field === 'dish' ? { dish: id } : { chef: id };
  const agg = await Review.aggregate([{ $match: { ...match, status: 'visible' } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const rating = { avg: Math.round((agg[0]?.avg || 0) * 10) / 10, count: agg[0]?.count || 0 };
  await Model.findByIdAndUpdate(id, { rating });
};

// POST /reviews { orderId, rating, text, images }
export const createReview = asyncHandler(async (req, res) => {
  const { orderId, rating, text, images } = req.body;
  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['delivered', 'customer_confirmed'].includes(order.status)) throw ApiError.badRequest('Can only review delivered orders');
  const dishId = order.items[0]?.dish;
  const review = await Review.create({ order: order._id, customer: req.user._id, dish: dishId, chef: order.chef, rating, text, images });
  order.status = 'reviewed';
  order.timeline.push({ status: 'reviewed' });
  await order.save();
  await recalcRating(Dish, 'dish', dishId);
  await recalcRating(HomeChef, 'chef', order.chef);
  created(res, review, 'Review submitted');
});

// POST /reviews/:id/reply  (chef)
export const replyToReview = asyncHandler(async (req, res) => {
  const chef = await HomeChef.findOne({ user: req.user._id });
  const review = await Review.findOne({ _id: req.params.id, chef: chef._id });
  if (!review) throw ApiError.notFound('Review not found');
  review.chefReply = { text: req.body.text, at: new Date() };
  await review.save();
  ok(res, review, 'Reply added');
});

// GET /reviews/dish/:dishId
export const dishReviews = asyncHandler(async (req, res) => {
  ok(res, await Review.find({ dish: req.params.dishId, status: 'visible' }).populate('customer', 'name avatar').sort('-createdAt'));
});
