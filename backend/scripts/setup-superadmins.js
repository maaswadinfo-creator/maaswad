/**
 * Grants platform_owner (Super Admin) role to the three designated phone numbers.
 * Run once in Render Shell:  node scripts/setup-superadmins.js
 *
 * Safe to re-run — it is idempotent (upserts, doesn't duplicate roles).
 */
import mongoose from 'mongoose';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import { ROLES } from '../src/config/constants.js';

const SUPER_ADMINS = [
  { phone: '+919841089868', name: 'Super Admin 1' },
  { phone: '+916383353101', name: 'Super Admin 2' },
  { phone: '+919884527733', name: 'Super Admin 3' },
];

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB\n');

  for (const { phone, name } of SUPER_ADMINS) {
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        name,
        roles: [ROLES.CUSTOMER, ROLES.OPS, ROLES.OWNER],
        activeRole: ROLES.OWNER,
        status: 'active',
      });
      console.log(`✅ Created new super admin: ${phone}`);
    } else {
      if (!user.roles.includes(ROLES.OWNER)) user.roles.push(ROLES.OWNER);
      if (!user.roles.includes(ROLES.OPS)) user.roles.push(ROLES.OPS);
      if (!user.roles.includes(ROLES.CUSTOMER)) user.roles.push(ROLES.CUSTOMER);
      user.activeRole = ROLES.OWNER;
      user.status = 'active';
      if (!user.name) user.name = name;
      await user.save();
      console.log(`✅ Updated existing user to super admin: ${phone} (roles: ${user.roles.join(', ')})`);
    }
  }

  console.log('\nDone! These numbers can now log in via phone OTP and access the Super Admin console.');
  console.log('Add them as Firebase test numbers if needed (Authentication → Sign-in method → Phone → Test numbers).');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
