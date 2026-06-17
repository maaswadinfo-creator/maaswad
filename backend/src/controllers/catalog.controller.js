import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';
import Dish from '../models/Dish.js';
import HomeChef from '../models/HomeChef.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';

// GET /catalog/dishes?search=&foodType=&cuisine=&category=&minPrice=&maxPrice=&minRating=&sort=&page=&limit=
export const browseDishes = asyncHandler(async (req, res) => {
  const { search, foodType, cuisine, category, minPrice, maxPrice, minRating, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  const filter = { status: 'published' };
  if (search) filter.$text = { $search: search };
  if (foodType) filter.foodType = foodType;
  if (cuisine) filter.$or = [{ cuisineRegion: cuisine }, { cuisineSub: cuisine }];
  if (category) filter.category = category;
  if (minPrice || maxPrice) filter.displayedPrice = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  if (minRating) filter['rating.avg'] = { $gte: +minRating };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Dish.find(filter).populate({ path: 'chef', select: 'fullName rating badges location' }).sort(sort).skip(skip).limit(+limit),
    Dish.countDocuments(filter),
  ]);
  ok(res, items, 'OK', { total, page: +page, pages: Math.ceil(total / limit) });
});

// GET /catalog/dishes/:id
export const dishDetail = asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id).populate({ path: 'chef', select: 'fullName rating badges cuisineSpecialization profilePhoto' });
  if (!dish) throw ApiError.notFound('Dish not found');
  const reviews = await Review.find({ dish: dish._id, status: 'visible' }).populate('customer', 'name avatar').sort('-createdAt').limit(20);
  ok(res, { dish, reviews });
});

// GET /catalog/chefs/:id
export const chefPublicProfile = asyncHandler(async (req, res) => {
  const chef = await HomeChef.findById(req.params.id).select('fullName rating badges cuisineSpecialization profilePhoto deliveryRadiusKm availableTimings');
  if (!chef) throw ApiError.notFound('Chef not found');
  const dishes = await Dish.find({ chef: chef._id, status: 'published' });
  ok(res, { chef, dishes });
});

// GET /catalog/chefs?search=&cuisine=
export const browseChefs = asyncHandler(async (req, res) => {
  const { search, cuisine } = req.query;
  const filter = { status: { $in: ['approved', 'active'] }, vacationMode: false };
  if (search) filter.fullName = new RegExp(search, 'i');
  if (cuisine) filter.cuisineSpecialization = cuisine;
  ok(res, await HomeChef.find(filter).select('fullName rating badges cuisineSpecialization profilePhoto').limit(50));
});

// GET /catalog/categories
export const listCategories = asyncHandler(async (_req, res) => {
  ok(res, await Category.find({ isActive: true }).sort('sortOrder'));
});
