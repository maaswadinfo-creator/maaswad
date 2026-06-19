/**
 * Admin Chef Controller
 * Handles: admin chef profile management, home visit scheduling, evaluation feedback,
 * and certificate generation (branded HTML email — printer-ready for PDF).
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import AdminChefProfile from '../models/AdminChefProfile.js';
import HomeVisit from '../models/HomeVisit.js';
import HomeChef from '../models/HomeChef.js';
import User from '../models/User.js';
import { notify, sendEmail } from '../services/notification.service.js';
import { ROLES } from '../config/constants.js';

// ── Cert number ───────────────────────────────────────────────────────────────
function generateCertNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MWD-${year}-${rand}`;
}

// ── Certificate HTML (printer-ready, exports to PDF via browser) ──────────────
function buildCertificateHtml({ chefName, certNumber, approvedDishes, adminChefName, issueDate }) {
  const dishRows = approvedDishes.map((d) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #fff5eb;color:#44403c;font-size:14px">✦ ${d}</td>
    </tr>`).join('');

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Maaswad Chef Certificate — ${certNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff7f0; font-family: 'Inter', system-ui, sans-serif; padding: 40px 20px; }
    .cert-wrap { max-width: 720px; margin: auto; }

    /* Email outer shell */
    .email-header {
      background: linear-gradient(135deg, #b45309, #9a3412);
      border-radius: 20px 20px 0 0;
      padding: 32px 40px;
      text-align: center;
      color: #fff;
    }
    .logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .logo-tagline { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }

    .email-body {
      background: #fff;
      border: 2px solid #fde68a;
      border-top: 0;
      border-radius: 0 0 20px 20px;
      padding: 40px;
    }

    /* Certificate document inside the email */
    .cert-document {
      border: 3px solid #b45309;
      border-radius: 16px;
      overflow: hidden;
      margin: 24px 0;
      position: relative;
    }
    .cert-inner {
      border: 6px solid #fef3c7;
      margin: 6px;
      border-radius: 12px;
      padding: 32px 36px;
      background: linear-gradient(160deg, #fffbf5, #fff7ed);
      text-align: center;
      position: relative;
    }
    /* decorative corner elements */
    .cert-inner::before, .cert-inner::after {
      content: '✦';
      position: absolute;
      font-size: 28px;
      color: #fbbf24;
      opacity: 0.4;
    }
    .cert-inner::before { top: 12px; left: 16px; }
    .cert-inner::after  { bottom: 12px; right: 16px; }

    .cert-badge {
      display: inline-block;
      background: linear-gradient(135deg, #b45309, #9a3412);
      color: #fef9ee;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      padding: 6px 20px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .cert-title {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      color: #92400e;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .cert-chef-name {
      font-family: 'Playfair Display', serif;
      font-size: 34px;
      font-weight: 800;
      color: #1c1917;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .cert-desc {
      font-size: 14px;
      color: #78716c;
      line-height: 1.7;
      max-width: 460px;
      margin: 0 auto 20px;
    }
    .cert-number-box {
      background: #fff7ed;
      border: 2px solid #fbbf24;
      border-radius: 10px;
      padding: 14px 24px;
      display: inline-block;
      margin-bottom: 24px;
    }
    .cert-number-label { font-size: 11px; color: #92400e; letter-spacing: 2px; text-transform: uppercase; }
    .cert-number-value { font-family: 'Courier New', monospace; font-size: 26px; font-weight: 700; color: #b45309; letter-spacing: 4px; margin-top: 4px; }

    .dishes-table { width: 100%; border-collapse: collapse; margin: 0 auto 24px; max-width: 360px; }
    .dishes-heading { font-size: 12px; color: #92400e; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }

    .cert-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      gap: 20px;
    }
    .sig-block { text-align: center; flex: 1; }
    .sig-line { border-top: 1.5px solid #d6d3d1; margin-bottom: 6px; }
    .sig-name { font-weight: 700; color: #1c1917; font-size: 14px; }
    .sig-title { font-size: 12px; color: #78716c; }

    .issue-date { font-size: 12px; color: #a8a29e; margin-top: 12px; }

    /* Next steps section */
    .next-steps {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-top: 24px;
    }
    .next-steps-title { font-weight: 700; color: #166534; font-size: 14px; margin-bottom: 6px; }
    .next-steps p { color: #15803d; font-size: 13px; line-height: 1.6; }

    .email-footer { text-align: center; padding: 24px 0 0; color: #a8a29e; font-size: 12px; }

    @media print {
      body { background: #fff; padding: 0; }
      .cert-wrap { max-width: 100%; }
      .next-steps, .email-footer, .print-note { display: none; }
    }
  </style>
</head>
<body>
<div class="cert-wrap">
  <!-- Email header with Maaswad branding -->
  <div class="email-header">
    <div class="logo-text">🍲 Maaswad</div>
    <div class="logo-tagline">Home Food, Made with Mother's Love</div>
  </div>

  <div class="email-body">
    <p style="color:#44403c;font-size:15px;line-height:1.7;margin-bottom:6px">
      Dear <strong>${chefName}</strong>,
    </p>
    <p style="color:#44403c;font-size:14px;line-height:1.7;margin-bottom:24px">
      We are thrilled to inform you that after a thorough home evaluation by our Master Chef,
      you have been <strong style="color:#16a34a">officially selected</strong> as a Maaswad Home Chef.
      Please find your certificate below.
    </p>

    <!-- Certificate Document -->
    <div class="cert-document">
      <div class="cert-inner">
        <div class="cert-badge">Official Certificate</div>

        <div class="cert-title">This certifies that</div>
        <div class="cert-chef-name">${chefName}</div>
        <p class="cert-desc">
          has been evaluated and approved as a certified Home Chef on the
          <strong>Maaswad Platform</strong>, authorised to serve home-cooked meals
          in the following cuisine specializations:
        </p>

        <!-- Cert number -->
        <div class="cert-number-box">
          <div class="cert-number-label">Certificate Number</div>
          <div class="cert-number-value">${certNumber}</div>
        </div>

        <!-- Approved cuisines -->
        <p class="dishes-heading">Approved Cuisine Specializations</p>
        <table class="dishes-table">
          <tbody>${dishRows}</tbody>
        </table>

        <!-- Signature row -->
        <div class="cert-footer-row">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">${adminChefName}</div>
            <div class="sig-title">Master Chef, Maaswad</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">Maaswad Platform</div>
            <div class="sig-title">Authorised Signatory</div>
          </div>
        </div>

        <div class="issue-date">Issued on ${formattedDate}</div>
      </div>
    </div>

    <!-- Next steps -->
    <div class="next-steps">
      <div class="next-steps-title">📋 Next Steps</div>
      <p>
        Please log in to the Maaswad app → go to your <strong>Chef Profile</strong>
        → tap <strong>"Upload Certificate"</strong> and upload a photo or screenshot of this certificate.
        Once verified by our team, your account will be fully activated and you can start listing your dishes!
      </p>
    </div>

    <div class="email-footer">
      Questions? Reach us at <strong>support@maaswad.app</strong><br />
      Maaswad — An initiative by Dr. Chef Vinoth Kumar
    </div>
  </div>
</div>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
// Admin Chef Profile Management (super admin / ops)
// ════════════════════════════════════════════════════════════════════════════

/** GET /admin-chefs — list all admin chef profiles */
export const listAdminChefs = asyncHandler(async (req, res) => {
  const profiles = await AdminChefProfile.find()
    .populate('user', 'phone name')
    .sort({ createdAt: -1 });
  ok(res, profiles);
});

/** POST /admin-chefs — create admin chef profile (upserts user by phone, grants admin_chef role) */
export const createAdminChef = asyncHandler(async (req, res) => {
  const { name, phone, photo, bio, specializations } = req.body;
  if (!name?.trim() || !phone?.trim()) throw ApiError.badRequest('name and phone are required');

  const normalised = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;

  // Upsert the User record
  let user = await User.findOne({ phone: normalised });
  if (!user) {
    user = await User.create({
      phone: normalised,
      name: name.trim(),
      roles: [ROLES.EVAL_CHEF, ROLES.CUSTOMER],
      activeRole: ROLES.EVAL_CHEF,
      isVerified: true,
    });
  } else {
    if (!user.roles.includes(ROLES.EVAL_CHEF)) {
      user.roles.push(ROLES.EVAL_CHEF);
      if (!user.activeRole) user.activeRole = ROLES.EVAL_CHEF;
      await user.save();
    }
  }

  // Create or update the profile
  const existing = await AdminChefProfile.findOne({ user: user._id });
  if (existing) throw ApiError.conflict('Admin chef profile already exists for this phone number');

  const profile = await AdminChefProfile.create({
    user: user._id,
    name: name.trim(),
    phone: normalised,
    photo: photo || null,
    bio: bio || '',
    specializations: specializations || [],
    createdBy: req.user._id,
  });

  created(res, profile, 'Admin chef profile created');
});

/** PATCH /admin-chefs/:id — update admin chef profile */
export const updateAdminChef = asyncHandler(async (req, res) => {
  const profile = await AdminChefProfile.findById(req.params.id);
  if (!profile) throw ApiError.notFound('Admin chef profile not found');

  const { name, photo, bio, specializations, isActive } = req.body;
  if (name !== undefined) profile.name = name;
  if (photo !== undefined) profile.photo = photo;
  if (bio !== undefined) profile.bio = bio;
  if (specializations !== undefined) profile.specializations = specializations;
  if (isActive !== undefined) profile.isActive = isActive;
  await profile.save();

  ok(res, profile, 'Updated');
});

/** DELETE /admin-chefs/:id — deactivate (soft delete) */
export const deactivateAdminChef = asyncHandler(async (req, res) => {
  const profile = await AdminChefProfile.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!profile) throw ApiError.notFound('Admin chef profile not found');
  ok(res, profile, 'Deactivated');
});

// ════════════════════════════════════════════════════════════════════════════
// Home Visit Scheduling (super admin / ops)
// ════════════════════════════════════════════════════════════════════════════

/** POST /home-visits — schedule a home visit for a home chef applicant */
export const scheduleVisit = asyncHandler(async (req, res) => {
  const { homeChefId, adminChefId, scheduledDate, scheduledTime, address, notes } = req.body;

  const homeChef = await HomeChef.findById(homeChefId);
  if (!homeChef) throw ApiError.notFound('Home chef application not found');

  const adminChef = await AdminChefProfile.findById(adminChefId);
  if (!adminChef || !adminChef.isActive) throw ApiError.badRequest('Admin chef not found or inactive');

  // Cancel any prior open visits for this home chef
  await HomeVisit.updateMany(
    { homeChef: homeChefId, status: 'scheduled' },
    { status: 'cancelled' }
  );

  const visit = await HomeVisit.create({
    homeChef: homeChefId,
    adminChef: adminChefId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime: scheduledTime || '',
    address: address || (homeChef.address
      ? `${homeChef.address.line1}, ${homeChef.address.city}, ${homeChef.address.state} ${homeChef.address.pincode}`
      : ''),
    notes: notes || '',
    scheduledBy: req.user._id,
  });

  // Move home chef to under_review
  if (homeChef.status === 'applied') {
    homeChef.status = 'under_review';
    await homeChef.save();
  }

  // Notify home chef
  await notify({
    userId: homeChef.user,
    type: 'in_app',
    title: 'Home Visit Scheduled',
    body: `A Maaswad master chef will visit you on ${new Date(scheduledDate).toLocaleDateString('en-IN')}${scheduledTime ? ` at ${scheduledTime}` : ''} to evaluate your cooking. Get ready!`,
  }).catch(() => {});

  const populated = await HomeVisit.findById(visit._id)
    .populate('adminChef', 'name phone photo')
    .populate('homeChef', 'fullName mobile address');

  created(res, populated, 'Home visit scheduled');
});

/** GET /home-visits — list all visits (admin) or own visits (admin chef) */
export const listVisits = asyncHandler(async (req, res) => {
  const { status, adminChefId } = req.query;
  const filter = {};

  // If caller is an admin_chef, scope to their own visits
  if (req.user.roles.includes(ROLES.EVAL_CHEF) && !req.user.roles.includes(ROLES.OWNER) && !req.user.roles.includes(ROLES.OPS)) {
    const profile = await AdminChefProfile.findOne({ user: req.user._id });
    if (!profile) throw ApiError.notFound('Admin chef profile not found');
    filter.adminChef = profile._id;
  } else if (adminChefId) {
    filter.adminChef = adminChefId;
  }

  if (status) filter.status = status;

  const visits = await HomeVisit.find(filter)
    .populate('homeChef', 'fullName mobile profilePhoto cuisineSpecialization address status')
    .populate('adminChef', 'name phone photo')
    .sort({ scheduledDate: 1, createdAt: -1 });

  ok(res, visits);
});

/** GET /home-visits/:id — single visit detail */
export const getVisit = asyncHandler(async (req, res) => {
  const visit = await HomeVisit.findById(req.params.id)
    .populate('homeChef', 'fullName mobile profilePhoto cuisineSpecialization address status user')
    .populate('adminChef', 'name phone photo specializations');
  if (!visit) throw ApiError.notFound('Visit not found');
  ok(res, visit);
});

/** PATCH /home-visits/:id/cancel */
export const cancelVisit = asyncHandler(async (req, res) => {
  const visit = await HomeVisit.findById(req.params.id);
  if (!visit) throw ApiError.notFound('Visit not found');
  if (visit.status !== 'scheduled') throw ApiError.badRequest('Only scheduled visits can be cancelled');
  visit.status = 'cancelled';
  await visit.save();
  ok(res, visit, 'Visit cancelled');
});

// ════════════════════════════════════════════════════════════════════════════
// Visit Evaluation (admin chef submits feedback + decision)
// ════════════════════════════════════════════════════════════════════════════

/** PATCH /home-visits/:id/evaluate — admin chef submits feedback and decision */
export const submitEvaluation = asyncHandler(async (req, res) => {
  const visit = await HomeVisit.findById(req.params.id)
    .populate('adminChef')
    .populate('homeChef');
  if (!visit) throw ApiError.notFound('Visit not found');

  // If caller is admin_chef, verify ownership
  if (req.user.roles.includes(ROLES.EVAL_CHEF)) {
    const profile = await AdminChefProfile.findOne({ user: req.user._id });
    if (!profile || String(visit.adminChef._id) !== String(profile._id)) {
      throw ApiError.forbidden('Not your visit to evaluate');
    }
  }

  const {
    foodRating, hygieneRating, overallRating,
    feedback, decision, rejectionReason, approvedDishes,
  } = req.body;

  if (!decision || !['selected', 'rejected'].includes(decision)) {
    throw ApiError.badRequest('decision must be "selected" or "rejected"');
  }
  if (decision === 'selected' && (!approvedDishes || !approvedDishes.length)) {
    throw ApiError.badRequest('At least one approved dish is required when selecting a chef');
  }

  visit.foodRating      = foodRating     || null;
  visit.hygieneRating   = hygieneRating  || null;
  visit.overallRating   = overallRating  || null;
  visit.feedback        = feedback       || '';
  visit.decision        = decision;
  visit.rejectionReason = rejectionReason || '';
  visit.approvedDishes  = approvedDishes || [];
  visit.status          = 'completed';
  visit.visitedAt       = new Date();
  await visit.save();

  // Update admin chef's evaluation count
  await AdminChefProfile.findByIdAndUpdate(visit.adminChef._id, { $inc: { totalEvaluations: 1 } });

  if (decision === 'rejected') {
    // Move home chef to rejected
    await HomeChef.findByIdAndUpdate(visit.homeChef._id, { status: 'rejected' });
    await notify({
      userId: visit.homeChef.user,
      type: 'in_app',
      title: 'Application Update',
      body: rejectionReason
        ? `We regret to inform you that your application was not selected. ${rejectionReason}`
        : 'We regret to inform you that your application was not selected at this time.',
    }).catch(() => {});
  }

  ok(res, visit, 'Evaluation submitted');
});

// ════════════════════════════════════════════════════════════════════════════
// Certificate Generation (called after selection)
// ════════════════════════════════════════════════════════════════════════════

/** POST /home-visits/:id/send-certificate — generate branded cert HTML and email it */
export const sendCertificate = asyncHandler(async (req, res) => {
  const visit = await HomeVisit.findById(req.params.id)
    .populate('homeChef')
    .populate('adminChef');
  if (!visit) throw ApiError.notFound('Visit not found');
  if (visit.decision !== 'selected') throw ApiError.badRequest('Chef must be selected before sending certificate');
  if (!visit.approvedDishes.length) throw ApiError.badRequest('No approved dishes on this visit');

  // Generate cert number if not already set
  if (!visit.certNumber) {
    visit.certNumber = generateCertNumber();
    await visit.save();
  }

  const homeChef = visit.homeChef;
  const adminChef = visit.adminChef;

  const certHtml = buildCertificateHtml({
    chefName: homeChef.fullName,
    certNumber: visit.certNumber,
    approvedDishes: visit.approvedDishes,
    adminChefName: adminChef.name,
    issueDate: new Date(),
  });

  // Get the home chef's user email
  const chefUser = await import('../models/User.js').then(m => m.default.findById(homeChef.user));
  const toEmail = chefUser?.email || homeChef.email;

  if (!toEmail) throw ApiError.badRequest('Home chef has no email on file to send the certificate');

  await sendEmail({
    to: toEmail,
    subject: `🎉 Your Maaswad Chef Certificate — ${visit.certNumber}`,
    html: certHtml,
  });

  // Update home chef to pending_certificate stage with cert number
  await HomeChef.findByIdAndUpdate(homeChef._id, {
    status: 'pending_certificate',
    generatedCertNumber: visit.certNumber,
    approvedDishes: visit.approvedDishes,
    certEmailSentAt: new Date(),
  });

  visit.certEmailSentAt = new Date();
  await visit.save();

  ok(res, { certNumber: visit.certNumber, sentTo: toEmail }, 'Certificate emailed successfully');
});
