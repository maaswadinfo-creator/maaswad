// Create distinct demo login profiles, one per role (idempotent — safe to re-run).
// Usage (in Render Shell):  node scripts/profiles.js
//
// After running, add the printed phone numbers as Firebase TEST numbers
// (Authentication -> Sign-in method -> Phone -> Phone numbers for testing)
// with the printed OTP codes, so you can log into each profile without real SMS.
import mongoose from 'mongoose';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import HomeChef from '../src/models/HomeChef.js';
import { ROLES } from '../src/config/constants.js';
import { nanoid } from '../src/utils/id.js';

const PROFILES = [
  { name: 'Super Admin', phone: '+919000000001', otp: '100001', roles: [ROLES.OWNER, ROLES.OPS, ROLES.CUSTOMER], active: ROLES.OWNER },
  { name: 'Admin',       phone: '+919000000002', otp: '100002', roles: [ROLES.OPS, ROLES.CUSTOMER], active: ROLES.OPS },
  { name: 'Demo Chef',   phone: '+919000000003', otp: '100003', roles: [ROLES.CHEF, ROLES.CUSTOMER], active: ROLES.CHEF, chef: true },
  { name: 'Demo User',   phone: '+919000000009', otp: '100009', roles: [ROLES.CUSTOMER], active: ROLES.CUSTOMER },
];

async function run() {
  await mongoose.connect(config.mongoUri);

  for (const p of PROFILES) {
    let user = await User.findOne({ phone: p.phone });
    if (!user) user = new User({ phone: p.phone, referralCode: nanoid(8) });
    user.name = p.name;
    user.roles = p.roles;
    user.activeRole = p.active;
    user.phoneVerified = true;
    if (!user.referralCode) user.referralCode = nanoid(8);
    await user.save();

    if (p.chef) {
      let chef = await HomeChef.findOne({ user: user._id });
      if (!chef) chef = new HomeChef({ user: user._id });
      Object.assign(chef, {
        fullName: p.name, mobile: p.phone, status: 'active', approvedAt: new Date(),
        cuisineSpecialization: ['Tamil Nadu'], availableTimings: ['08:00-22:00'], deliveryRadiusKm: 7,
        location: { type: 'Point', coordinates: [76.9558, 11.0168] },
      });
      await chef.save();
    }
  }

  console.log('\n✅ Profiles ready. Add these as Firebase TEST phone numbers:\n');
  console.log('  Role         Phone            OTP code');
  console.log('  ----         -----            --------');
  for (const p of PROFILES) console.log(`  ${p.name.padEnd(11)}  ${p.phone}   ${p.otp}`);
  console.log('\nFirebase Console -> Authentication -> Sign-in method -> Phone');
  console.log('-> "Phone numbers for testing" -> add each phone + code above.\n');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
