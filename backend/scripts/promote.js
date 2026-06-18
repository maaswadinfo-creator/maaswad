// Promote a phone number to ALL roles so you can explore every dashboard.
// Usage (in Render Shell):  node scripts/promote.js +91XXXXXXXXXX
import mongoose from 'mongoose';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import HomeChef from '../src/models/HomeChef.js';
import DeliveryPartner from '../src/models/DeliveryPartner.js';
import { ROLE_LIST, ROLES } from '../src/config/constants.js';

async function run() {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: node scripts/promote.js +91XXXXXXXXXX');
    process.exit(1);
  }
  await mongoose.connect(config.mongoUri);

  const user = await User.findOne({ phone });
  if (!user) {
    console.error(`No user with phone ${phone}. Log in once on the website first, then re-run.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.roles = [...ROLE_LIST];
  user.activeRole = ROLES.OWNER;
  await user.save();

  // Ensure an ACTIVE chef profile exists (so the chef dashboard + "Add Dish" work)
  let chef = await HomeChef.findOne({ user: user._id });
  if (!chef) {
    chef = await HomeChef.create({
      user: user._id, fullName: user.name || 'My Kitchen', mobile: phone, email: user.email,
      status: 'active', approvedAt: new Date(), cuisineSpecialization: ['Tamil Nadu'],
      availableTimings: ['08:00-22:00'], deliveryRadiusKm: 7,
      location: { type: 'Point', coordinates: [76.9558, 11.0168] },
    });
  } else { chef.status = 'active'; chef.approvedAt = chef.approvedAt || new Date(); await chef.save(); }

  // Ensure an ACTIVE delivery profile exists
  let dp = await DeliveryPartner.findOne({ user: user._id });
  if (!dp) {
    dp = await DeliveryPartner.create({
      user: user._id, name: user.name || 'Rider', mobile: phone, vehicleType: 'bike',
      status: 'active', isOnline: true, approvedAt: new Date(),
      currentLocation: { type: 'Point', coordinates: [76.9558, 11.0168] },
    });
  } else { dp.status = 'active'; await dp.save(); }

  console.log(`✅ ${phone} promoted. Roles: ${user.roles.join(', ')}`);
  console.log('Refresh the website and open Account — you can now switch to Chef, Delivery, and Admin.');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
