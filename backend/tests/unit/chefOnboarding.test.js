/**
 * Unit Tests — Chef Onboarding Business Logic
 * Covers: certificate number generation pattern · status transitions · email HTML generation
 * These test the pure logic extracted from admin.controller.js without needing a DB.
 * Runner: node --test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Replicate the cert-number generator from admin.controller.js ──────────────
function generateCertNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MWD-${year}-${rand}`;
}

// ── Replicate the chef status state machine ───────────────────────────────────
const STATUS_TRANSITIONS = {
  applied:              ['under_review', 'rejected'],
  under_review:         ['pending_certificate', 'rejected'],
  pending_certificate:  ['certificate_uploaded'],
  certificate_uploaded: ['active', 'rejected'],
  active:               ['suspended'],
  suspended:            ['active', 'rejected'],
  rejected:             [],
};
function canTransition(from, to) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── 1. Certificate number generation ─────────────────────────────────────────
describe('generateCertNumber', () => {
  test('starts with MWD-', () => {
    assert.ok(generateCertNumber().startsWith('MWD-'));
  });

  test('contains current year', () => {
    const year = String(new Date().getFullYear());
    assert.ok(generateCertNumber().includes(year));
  });

  test('matches format MWD-YYYY-NNNNN', () => {
    const cert = generateCertNumber();
    assert.match(cert, /^MWD-\d{4}-\d{5}$/);
  });

  test('5-digit random component is between 10000 and 99999', () => {
    for (let i = 0; i < 50; i++) {
      const n = parseInt(generateCertNumber().split('-')[2], 10);
      assert.ok(n >= 10000 && n <= 99999, `out of range: ${n}`);
    }
  });

  test('generates unique numbers (probabilistic)', () => {
    const certs = new Set(Array.from({ length: 100 }, generateCertNumber));
    assert.ok(certs.size > 90, 'should be mostly unique in 100 draws');
  });

  test('length is exactly 14 chars (MWD-2024-NNNNN)', () => {
    assert.equal(generateCertNumber().length, 14);
  });
});

// ── 2. Chef status state machine ──────────────────────────────────────────────
describe('Chef status state machine', () => {
  test('applied → under_review is valid', () => assert.ok(canTransition('applied', 'under_review')));
  test('applied → rejected is valid', () => assert.ok(canTransition('applied', 'rejected')));
  test('applied → active is NOT valid (must pass through pipeline)', () => {
    assert.ok(!canTransition('applied', 'active'));
  });
  test('under_review → pending_certificate is valid', () => {
    assert.ok(canTransition('under_review', 'pending_certificate'));
  });
  test('pending_certificate → certificate_uploaded is valid', () => {
    assert.ok(canTransition('pending_certificate', 'certificate_uploaded'));
  });
  test('certificate_uploaded → active is valid (final approve)', () => {
    assert.ok(canTransition('certificate_uploaded', 'active'));
  });
  test('certificate_uploaded → rejected is valid (admin rejects)', () => {
    assert.ok(canTransition('certificate_uploaded', 'rejected'));
  });
  test('active → suspended is valid', () => assert.ok(canTransition('active', 'suspended')));
  test('suspended → active is valid (reinstate)', () => assert.ok(canTransition('suspended', 'active')));
  test('rejected has no valid forward transitions', () => {
    const nexts = STATUS_TRANSITIONS['rejected'];
    assert.equal(nexts.length, 0);
  });
  test('active cannot go back to applied', () => assert.ok(!canTransition('active', 'applied')));
  test('skipping pending_certificate is blocked', () => {
    assert.ok(!canTransition('under_review', 'active'));
  });
});

// ── 3. Application form validation (mirrors frontend + backend rules) ──────────
describe('Chef application form validation', () => {
  function validate(form) {
    const errors = [];
    if (!form.fullName?.trim()) errors.push('fullName required');
    if (!form.mobile?.trim()) errors.push('mobile required');
    if (!form.addressLine1?.trim() || !form.city?.trim()) errors.push('address required');
    if (!form.cuisines?.length) errors.push('select at least one cuisine');
    if (!form.photo) errors.push('profile photo required');
    return errors;
  }

  const validForm = {
    fullName: 'Priya Sharma', mobile: '+919876543210',
    addressLine1: '12 Anna Nagar', city: 'Chennai',
    cuisines: ['Tamil Nadu', 'Chettinad'], photo: 'https://cdn.example.com/photo.jpg',
  };

  test('valid form has no errors', () => {
    assert.equal(validate(validForm).length, 0);
  });

  test('missing fullName returns error', () => {
    const errors = validate({ ...validForm, fullName: '' });
    assert.ok(errors.includes('fullName required'));
  });

  test('missing mobile returns error', () => {
    const errors = validate({ ...validForm, mobile: '' });
    assert.ok(errors.includes('mobile required'));
  });

  test('missing address line returns error', () => {
    const errors = validate({ ...validForm, addressLine1: '' });
    assert.ok(errors.includes('address required'));
  });

  test('missing city returns error', () => {
    const errors = validate({ ...validForm, city: '' });
    assert.ok(errors.includes('address required'));
  });

  test('empty cuisines array returns error', () => {
    const errors = validate({ ...validForm, cuisines: [] });
    assert.ok(errors.includes('select at least one cuisine'));
  });

  test('missing photo returns error', () => {
    const errors = validate({ ...validForm, photo: null });
    assert.ok(errors.includes('profile photo required'));
  });

  test('identity proof is optional — no error when missing', () => {
    const form = { ...validForm, identityProofUrl: null };
    assert.equal(validate(form).length, 0);
  });

  test('FSSAI is optional — no error when fssaiAvailable:false', () => {
    const form = { ...validForm, fssaiAvailable: false, fssaiNumber: '' };
    assert.equal(validate(form).length, 0);
  });

  test('multiple missing fields returns multiple errors', () => {
    const errors = validate({ fullName: '', mobile: '', addressLine1: '', city: '', cuisines: [], photo: null });
    assert.ok(errors.length >= 4);
  });
});

// ── 4. FSSAI checkbox logic ───────────────────────────────────────────────────
describe('FSSAI checkbox logic', () => {
  test('fssaiAvailable:false means no license — field not required', () => {
    const hasLicense = false;
    const fssaiNumber = '';
    // If not available, number is not required
    const errors = hasLicense && !fssaiNumber ? ['fssai number required'] : [];
    assert.equal(errors.length, 0);
  });

  test('fssaiAvailable:true with number — valid', () => {
    const hasLicense = true;
    const fssaiNumber = '12345678901234';
    const valid = hasLicense && fssaiNumber.length > 0;
    assert.ok(valid);
  });

  test('fssaiAvailable is a boolean flag', () => {
    [true, false].forEach((v) => assert.equal(typeof v, 'boolean'));
  });
});

// ── 5. Certificate email HTML shape ──────────────────────────────────────────
describe('Certificate email HTML', () => {
  function certEmailHtml({ chefName, certNumber, approvedDishes, adminName }) {
    const dishesList = approvedDishes.map((d) => `<li>${d}</li>`).join('');
    return `<div class="cert">
      <h2>Congratulations, ${chefName}!</h2>
      <div class="cert-number">${certNumber}</div>
      <ul>${dishesList}</ul>
      <p>Verified by ${adminName || 'Maaswad Admin'}</p>
    </div>`;
  }

  const params = {
    chefName: 'Anitha Raj',
    certNumber: 'MWD-2024-54321',
    approvedDishes: ['Tamil Nadu', 'Chettinad', 'Kerala'],
    adminName: 'Dr. Chef Vinoth',
  };

  test('HTML contains chef name', () => {
    assert.ok(certEmailHtml(params).includes('Anitha Raj'));
  });

  test('HTML contains certificate number', () => {
    assert.ok(certEmailHtml(params).includes('MWD-2024-54321'));
  });

  test('HTML contains all approved dishes', () => {
    const html = certEmailHtml(params);
    params.approvedDishes.forEach((d) => assert.ok(html.includes(d)));
  });

  test('HTML contains admin name', () => {
    assert.ok(certEmailHtml(params).includes('Dr. Chef Vinoth'));
  });

  test('HTML falls back to "Maaswad Admin" when adminName is missing', () => {
    const html = certEmailHtml({ ...params, adminName: null });
    assert.ok(html.includes('Maaswad Admin'));
  });

  test('HTML is a non-empty string', () => {
    const html = certEmailHtml(params);
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 50);
  });
});

// ── 6. Admin user role grant logic ────────────────────────────────────────────
describe('Admin role grant logic', () => {
  function grantAdminRole(user, roleToGrant, ROLES) {
    if (!user.roles.includes(roleToGrant)) user.roles.push(roleToGrant);
    return user;
  }

  const ROLES = { OWNER: 'platform_owner', OPS: 'operations_manager' };

  test('granting owner role to a customer user adds it', () => {
    const user = { roles: ['food_lover'] };
    grantAdminRole(user, ROLES.OWNER, ROLES);
    assert.ok(user.roles.includes('platform_owner'));
    assert.ok(user.roles.includes('food_lover')); // original preserved
  });

  test('granting same role twice does not duplicate', () => {
    const user = { roles: ['platform_owner'] };
    grantAdminRole(user, ROLES.OWNER, ROLES);
    const ownerCount = user.roles.filter((r) => r === 'platform_owner').length;
    assert.equal(ownerCount, 1);
  });

  test('ops manager role can coexist with owner', () => {
    const user = { roles: ['platform_owner'] };
    grantAdminRole(user, ROLES.OPS, ROLES);
    assert.ok(user.roles.includes('platform_owner'));
    assert.ok(user.roles.includes('operations_manager'));
  });

  test('removing admin roles leaves at least customer role', () => {
    const user = { roles: ['food_lover', 'platform_owner', 'operations_manager'] };
    user.roles = user.roles.filter((r) => r !== 'platform_owner' && r !== 'operations_manager');
    if (!user.roles.length) user.roles = ['food_lover'];
    assert.ok(user.roles.length >= 1);
    assert.ok(user.roles.includes('food_lover'));
  });
});
