import mongoose from 'mongoose';
import config from '../src/config/index.js';
import { ROLES, CUISINES, SPECIAL_CATEGORIES } from '../src/config/constants.js';
import User from '../src/models/User.js';
import HomeChef from '../src/models/HomeChef.js';
import DeliveryPartner from '../src/models/DeliveryPartner.js';
import Dish from '../src/models/Dish.js';
import Category from '../src/models/Category.js';
import Coupon from '../src/models/Coupon.js';
import Setting from '../src/models/Setting.js';
import { nanoid } from '../src/utils/id.js';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected. Seeding...');

  await Promise.all([
    User.deleteMany({}), HomeChef.deleteMany({}), DeliveryPartner.deleteMany({}),
    Dish.deleteMany({}), Category.deleteMany({}), Coupon.deleteMany({}), Setting.deleteMany({}),
  ]);

  await Setting.create({ key: 'platform', content: {
    aboutUs: 'Maaswad connects verified home chefs with food lovers. Founded by Dr. Chef Vinoth.',
    privacyPolicy: 'We respect your privacy.', terms: 'Standard terms apply.',
    contactUs: 'support@maaswad.app', faq: [{ q: 'How do I order?', a: 'Browse, add to cart, checkout.' }],
  } });

  // Categories
  const cats = [];
  for (const [region, subs] of Object.entries(CUISINES)) {
    cats.push({ name: region, slug: slugify(region), type: 'cuisine_region' });
    subs.forEach((s) => cats.push({ name: s, slug: slugify(s), type: 'cuisine_sub' }));
  }
  SPECIAL_CATEGORIES.forEach((s) => cats.push({ name: s, slug: slugify(s), type: 'special' }));
  await Category.insertMany(cats);

  // Owner + Ops
  const owner = await User.create({ name: 'Dr. Chef Vinoth', email: config.seed.ownerEmail, phone: config.seed.ownerPhone, roles: [ROLES.OWNER, ROLES.OPS, ROLES.CUSTOMER], activeRole: ROLES.OWNER, emailVerified: true, phoneVerified: true, referralCode: nanoid(8) });
  await owner.setPassword('Owner@123'); await owner.save();
  const ops = await User.create({ name: 'Ops Manager', email: 'ops@maaswad.app', phone: '+919000000002', roles: [ROLES.OPS, ROLES.CUSTOMER], activeRole: ROLES.OPS, emailVerified: true, referralCode: nanoid(8) });

  // Chefs
  const chefSeed = [
    { name: 'Lakshmi Amma', city: 'Coimbatore', cuisines: ['Tamil Nadu', 'Kongunadu'], coords: [76.9558, 11.0168] },
    { name: 'Anjali Reddy', city: 'Hyderabad', cuisines: ['Andhra', 'Telangana'], coords: [78.4867, 17.385] },
    { name: 'Gurpreet Kaur', city: 'Amritsar', cuisines: ['Punjabi'], coords: [74.8723, 31.634] },
  ];
  const dishesByCuisine = {
    'Tamil Nadu': [['Idli Sambar', 'veg', 80, 'Breakfast'], ['Chettinad Chicken', 'non_veg', 220, 'Traditional Foods']],
    'Kongunadu': [['Arisi Paruppu Sadam', 'veg', 120, 'Traditional Foods']],
    'Andhra': [['Gongura Mutton', 'non_veg', 280, 'Traditional Foods'], ['Pesarattu', 'veg', 90, 'Healthy Foods']],
    'Telangana': [['Hyderabadi Biryani', 'non_veg', 250, 'Festival Foods']],
    'Punjabi': [['Sarson Da Saag', 'veg', 180, 'Traditional Foods'], ['Butter Chicken', 'non_veg', 260, 'Traditional Foods']],
  };

  for (const cs of chefSeed) {
    const u = await User.create({ name: cs.name, email: `${slugify(cs.name)}@maaswad.app`, phone: `+9190000${Math.floor(1000 + Math.random()*8999)}`, roles: [ROLES.CHEF, ROLES.CUSTOMER], activeRole: ROLES.CHEF, phoneVerified: true, referralCode: nanoid(8) });
    const chef = await HomeChef.create({
      user: u._id, fullName: cs.name, mobile: u.phone, email: u.email,
      address: { city: cs.city, state: '-' }, kitchenAddress: { city: cs.city },
      cuisineSpecialization: cs.cuisines, deliveryRadiusKm: 7,
      availableTimings: ['08:00-11:00', '12:00-15:00', '19:00-22:00'],
      location: { type: 'Point', coordinates: cs.coords },
      status: 'active', approvedAt: new Date(), rating: { avg: 4.6, count: 23 },
      badges: ['top_rated'],
    });
    for (const cuisine of cs.cuisines) {
      for (const [name, foodType, basePrice, category] of (dishesByCuisine[cuisine] || [])) {
        await Dish.create({
          chef: chef._id, name, description: `Authentic ${cuisine} ${name} made with mother's love.`,
          category, cuisineRegion: cs.cuisines[0], cuisineSub: cuisine, basePrice,
          displayedPrice: Math.round(basePrice * 1.15), quantityAvailable: 20, servingSize: '1 plate',
          ingredients: ['fresh local produce'], allergens: [], foodType, preparationTimeMins: 30,
          images: [], tags: [cuisine, category], status: 'published', rating: { avg: 4.5, count: 12 },
        });
      }
    }
  }

  // Delivery partner
  const du = await User.create({ name: 'Ravi Kumar', phone: '+919000000050', roles: [ROLES.DELIVERY, ROLES.CUSTOMER], activeRole: ROLES.DELIVERY, phoneVerified: true, referralCode: nanoid(8) });
  await DeliveryPartner.create({ user: du._id, name: 'Ravi Kumar', mobile: du.phone, vehicleType: 'bike', vehicleNumber: 'TN37AB1234', status: 'active', isOnline: true, approvedAt: new Date(), currentLocation: { type: 'Point', coordinates: [76.9558, 11.0168] } });

  // Customer
  const cust = await User.create({ name: 'Priya', phone: '+919000000099', email: 'priya@example.com', roles: [ROLES.CUSTOMER], activeRole: ROLES.CUSTOMER, phoneVerified: true, loyaltyPoints: 100, referralCode: nanoid(8) });

  // Coupons
  await Coupon.insertMany([
    { code: 'WELCOME50', type: 'fixed', value: 50, minOrder: 200, perUserLimit: 1 },
    { code: 'MAAS10', type: 'percentage', value: 10, maxDiscount: 100, minOrder: 300 },
  ]);

  console.log('Seed complete.');
  console.log('Owner login:', config.seed.ownerEmail, '/ phone', config.seed.ownerPhone);
  console.log('Customer phone:', cust.phone);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
