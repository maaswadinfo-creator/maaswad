/**
 * Unit Tests — Constants & Config
 * Covers: ROLES · ROLE_LIST · CHEF_STATUS · ORDER_STATUS · DISH_STATUS · CUISINES · SPECIAL_CATEGORIES
 * Runner: node --test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLES, ROLE_LIST, CHEF_STATUS, DELIVERY_STATUS, DISH_STATUS,
  ORDER_STATUS, PAYMENT_STATUS, SETTLEMENT_STATUS, CUISINES, SPECIAL_CATEGORIES,
} from '../../src/config/constants.js';

// ── ROLES ────────────────────────────────────────────────────────────────────
describe('ROLES', () => {
  test('has exactly 5 roles', () => assert.equal(Object.keys(ROLES).length, 5));
  test('OWNER is platform_owner', () => assert.equal(ROLES.OWNER, 'platform_owner'));
  test('OPS is operations_manager', () => assert.equal(ROLES.OPS, 'operations_manager'));
  test('DELIVERY is delivery_partner', () => assert.equal(ROLES.DELIVERY, 'delivery_partner'));
  test('CHEF is home_chef', () => assert.equal(ROLES.CHEF, 'home_chef'));
  test('CUSTOMER is food_lover', () => assert.equal(ROLES.CUSTOMER, 'food_lover'));
  test('all role values are non-empty strings', () => {
    Object.values(ROLES).forEach((v) => {
      assert.equal(typeof v, 'string');
      assert.ok(v.length > 0);
    });
  });
});

// ── ROLE_LIST ─────────────────────────────────────────────────────────────────
describe('ROLE_LIST', () => {
  test('is an array', () => assert.ok(Array.isArray(ROLE_LIST)));
  test('contains all 5 role values', () => {
    assert.equal(ROLE_LIST.length, 5);
    Object.values(ROLES).forEach((r) => assert.ok(ROLE_LIST.includes(r)));
  });
  test('has no duplicates', () => {
    assert.equal(new Set(ROLE_LIST).size, ROLE_LIST.length);
  });
  test('matches Object.values(ROLES)', () => {
    assert.deepEqual(ROLE_LIST, Object.values(ROLES));
  });
});

// ── CHEF_STATUS ───────────────────────────────────────────────────────────────
describe('CHEF_STATUS', () => {
  const expected = ['applied', 'under_review', 'pending_certificate', 'certificate_uploaded', 'approved', 'active', 'suspended', 'rejected'];
  test('is an array', () => assert.ok(Array.isArray(CHEF_STATUS)));
  test('contains all 8 expected statuses', () => {
    assert.equal(CHEF_STATUS.length, 8);
    expected.forEach((s) => assert.ok(CHEF_STATUS.includes(s), `missing: ${s}`));
  });
  test('no duplicates', () => assert.equal(new Set(CHEF_STATUS).size, CHEF_STATUS.length));
  test('starts with "applied"', () => assert.equal(CHEF_STATUS[0], 'applied'));
  test('includes onboarding pipeline statuses', () => {
    assert.ok(CHEF_STATUS.includes('pending_certificate'));
    assert.ok(CHEF_STATUS.includes('certificate_uploaded'));
  });
  test('includes terminal statuses (rejected, suspended)', () => {
    assert.ok(CHEF_STATUS.includes('rejected'));
    assert.ok(CHEF_STATUS.includes('suspended'));
  });
});

// ── DELIVERY_STATUS ───────────────────────────────────────────────────────────
describe('DELIVERY_STATUS', () => {
  test('is an array with at least 4 entries', () => {
    assert.ok(Array.isArray(DELIVERY_STATUS));
    assert.ok(DELIVERY_STATUS.length >= 4);
  });
  test('contains applied and active', () => {
    assert.ok(DELIVERY_STATUS.includes('applied'));
    assert.ok(DELIVERY_STATUS.includes('active'));
  });
});

// ── DISH_STATUS ───────────────────────────────────────────────────────────────
describe('DISH_STATUS', () => {
  test('is an array', () => assert.ok(Array.isArray(DISH_STATUS)));
  test('contains published and pending_approval', () => {
    assert.ok(DISH_STATUS.includes('published'));
    assert.ok(DISH_STATUS.includes('pending_approval'));
  });
  test('contains rejected', () => assert.ok(DISH_STATUS.includes('rejected')));
  test('no duplicates', () => assert.equal(new Set(DISH_STATUS).size, DISH_STATUS.length));
});

// ── ORDER_STATUS ──────────────────────────────────────────────────────────────
describe('ORDER_STATUS', () => {
  const required = ['pending_payment', 'paid', 'created', 'chef_notified', 'chef_accepted',
    'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];
  test('is an array', () => assert.ok(Array.isArray(ORDER_STATUS)));
  test('has at least 15 statuses (full lifecycle)', () => assert.ok(ORDER_STATUS.length >= 15));
  test('contains all key lifecycle statuses', () => {
    required.forEach((s) => assert.ok(ORDER_STATUS.includes(s), `missing: ${s}`));
  });
  test('no duplicates', () => assert.equal(new Set(ORDER_STATUS).size, ORDER_STATUS.length));
  test('starts with pending_payment', () => assert.equal(ORDER_STATUS[0], 'pending_payment'));
});

// ── PAYMENT_STATUS ────────────────────────────────────────────────────────────
describe('PAYMENT_STATUS', () => {
  test('contains pending, success, failed, refunded', () => {
    ['pending', 'success', 'failed', 'refunded'].forEach((s) =>
      assert.ok(PAYMENT_STATUS.includes(s), `missing: ${s}`));
  });
});

// ── SETTLEMENT_STATUS ─────────────────────────────────────────────────────────
describe('SETTLEMENT_STATUS', () => {
  test('contains pending and paid', () => {
    assert.ok(SETTLEMENT_STATUS.includes('pending'));
    assert.ok(SETTLEMENT_STATUS.includes('paid'));
  });
});

// ── CUISINES ──────────────────────────────────────────────────────────────────
describe('CUISINES', () => {
  test('is an object', () => assert.equal(typeof CUISINES, 'object'));
  test('has at least 4 cuisine categories', () => assert.ok(Object.keys(CUISINES).length >= 4));
  test('South Indian category exists', () => assert.ok('South Indian' in CUISINES));
  test('South Indian includes Tamil Nadu', () => assert.ok(CUISINES['South Indian'].includes('Tamil Nadu')));
  test('South Indian includes Chettinad', () => assert.ok(CUISINES['South Indian'].includes('Chettinad')));
  test('North Indian exists', () => assert.ok('North Indian' in CUISINES));
  test('all values are non-empty arrays', () => {
    Object.entries(CUISINES).forEach(([k, v]) => {
      assert.ok(Array.isArray(v), `${k} should be an array`);
      assert.ok(v.length > 0, `${k} should not be empty`);
    });
  });
});

// ── SPECIAL_CATEGORIES ────────────────────────────────────────────────────────
describe('SPECIAL_CATEGORIES', () => {
  test('is an array', () => assert.ok(Array.isArray(SPECIAL_CATEGORIES)));
  test('contains Vegetarian', () => assert.ok(SPECIAL_CATEGORIES.includes('Vegetarian')));
  test('contains Millet Foods', () => assert.ok(SPECIAL_CATEGORIES.includes('Millet Foods')));
  test('contains Kids Special', () => assert.ok(SPECIAL_CATEGORIES.includes('Kids Special')));
  test('has at least 8 categories', () => assert.ok(SPECIAL_CATEGORIES.length >= 8));
  test('no duplicates', () => assert.equal(new Set(SPECIAL_CATEGORIES).size, SPECIAL_CATEGORIES.length));
  test('all entries are non-empty strings', () => {
    SPECIAL_CATEGORIES.forEach((c) => {
      assert.equal(typeof c, 'string');
      assert.ok(c.length > 0);
    });
  });
});
