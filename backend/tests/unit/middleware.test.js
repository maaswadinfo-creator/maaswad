/**
 * Unit Tests — Middleware
 * Covers: rbac (authorize) · auth (authenticate) · asyncHandler · error handler shapes
 * Runner: node --test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Setup env before importing config-dependent modules ──
process.env.JWT_ACCESS_SECRET  = 'test-access-maaswad';
process.env.JWT_REFRESH_SECRET = 'test-refresh-maaswad';
process.env.JWT_ACCESS_EXPIRES  = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.NODE_ENV = 'test';

import { authorize } from '../../src/middleware/rbac.js';
import ApiError from '../../src/utils/ApiError.js';
import asyncHandler from '../../src/utils/asyncHandler.js';

// ── Tiny mock factories ───────────────────────────────────────────────────────
const mockRes = () => ({ status: () => mockRes(), json: () => {} });
const mockNext = () => {
  let called = null;
  const fn = (arg) => { called = arg ?? true; };
  fn.calledWith = () => called;
  fn.wasCalled = () => called !== null;
  return fn;
};

// ── 1. RBAC middleware (authorize) ────────────────────────────────────────────
describe('authorize middleware', () => {
  test('calls next() when user has the required role', () => {
    const req = { user: { roles: ['platform_owner'] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    assert.ok(next.wasCalled());
    assert.equal(next.calledWith(), true); // next() called with no args = pass
  });

  test('calls next() when user has one of multiple allowed roles', () => {
    const req = { user: { roles: ['operations_manager'] } };
    const next = mockNext();
    authorize('platform_owner', 'operations_manager')(req, mockRes(), next);
    assert.ok(next.wasCalled());
    assert.equal(next.calledWith(), true);
  });

  test('passes ApiError 403 when user lacks the required role', () => {
    const req = { user: { roles: ['food_lover'] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    const err = next.calledWith();
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 403);
  });

  test('passes ApiError 401 when req.user is missing', () => {
    const req = {};
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    const err = next.calledWith();
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 401);
  });

  test('passes ApiError 403 when user has empty roles array', () => {
    const req = { user: { roles: [] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    const err = next.calledWith();
    assert.equal(err.statusCode, 403);
  });

  test('passes when user has multiple roles and one matches', () => {
    const req = { user: { roles: ['food_lover', 'home_chef', 'platform_owner'] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    assert.equal(next.calledWith(), true);
  });

  test('blocks user who has home_chef but route needs platform_owner', () => {
    const req = { user: { roles: ['home_chef'] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    const err = next.calledWith();
    assert.equal(err.statusCode, 403);
  });

  test('returns a middleware function (function arity check)', () => {
    const mw = authorize('platform_owner');
    assert.equal(typeof mw, 'function');
    assert.equal(mw.length, 3); // (req, res, next)
  });

  test('403 error message mentions "role"', () => {
    const req = { user: { roles: ['food_lover'] } };
    const next = mockNext();
    authorize('platform_owner')(req, mockRes(), next);
    const err = next.calledWith();
    assert.ok(err.message.toLowerCase().includes('role'));
  });

  test('no-arg authorize() rejects everyone (empty allowed list)', () => {
    const req = { user: { roles: ['platform_owner'] } };
    const next = mockNext();
    authorize()(req, mockRes(), next);
    const err = next.calledWith();
    assert.equal(err.statusCode, 403);
  });
});

// ── 2. asyncHandler ───────────────────────────────────────────────────────────
describe('asyncHandler', () => {
  test('calls the wrapped async function', async () => {
    let called = false;
    const handler = asyncHandler(async (_req, _res) => { called = true; });
    await handler({}, mockRes(), mockNext());
    assert.ok(called);
  });

  test('passes thrown errors to next()', async () => {
    const boom = new Error('kaboom');
    const handler = asyncHandler(async () => { throw boom; });
    const next = mockNext();
    await handler({}, mockRes(), next);
    assert.equal(next.calledWith(), boom);
  });

  test('passes ApiError thrown inside handler to next()', async () => {
    const handler = asyncHandler(async () => { throw ApiError.notFound('item not found'); });
    const next = mockNext();
    await handler({}, mockRes(), next);
    const err = next.calledWith();
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 404);
  });

  test('does not call next() when handler resolves successfully', async () => {
    const handler = asyncHandler(async (_req, res) => { res.json({ ok: true }); });
    const next = mockNext();
    let jsonCalled = false;
    const res = { json: () => { jsonCalled = true; } };
    await handler({}, res, next);
    assert.ok(jsonCalled);
    assert.ok(!next.wasCalled());
  });

  test('returns a function with 3 params (req, res, next)', () => {
    const handler = asyncHandler(async () => {});
    assert.equal(typeof handler, 'function');
    assert.equal(handler.length, 3);
  });

  test('handles synchronous throw inside async fn', async () => {
    const handler = asyncHandler(async () => { throw new TypeError('sync-like throw'); });
    const next = mockNext();
    await handler({}, mockRes(), next);
    const err = next.calledWith();
    assert.ok(err instanceof TypeError);
    assert.equal(err.message, 'sync-like throw');
  });
});

// ── 3. ApiError in middleware context ─────────────────────────────────────────
describe('ApiError — middleware integration', () => {
  test('badRequest 400 propagates correctly through asyncHandler', async () => {
    const handler = asyncHandler(async () => { throw ApiError.badRequest('invalid data'); });
    const next = mockNext();
    await handler({}, mockRes(), next);
    const err = next.calledWith();
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, 'invalid data');
    assert.equal(err.isOperational, true);
  });

  test('multiple authorize calls can be chained (both pass)', () => {
    const req = { user: { roles: ['platform_owner', 'operations_manager'] } };
    const next1 = mockNext();
    const next2 = mockNext();
    authorize('platform_owner')(req, mockRes(), next1);
    authorize('operations_manager')(req, mockRes(), next2);
    assert.equal(next1.calledWith(), true);
    assert.equal(next2.calledWith(), true);
  });

  test('multiple authorize calls — one passes, one blocks', () => {
    const req = { user: { roles: ['operations_manager'] } };
    const nextPass = mockNext();
    const nextBlock = mockNext();
    authorize('operations_manager')(req, mockRes(), nextPass);
    authorize('platform_owner')(req, mockRes(), nextBlock);
    assert.equal(nextPass.calledWith(), true);
    assert.equal(nextBlock.calledWith().statusCode, 403);
  });
});

// ── 4. JWT-based authenticate mock (unit-level, no DB) ────────────────────────
import { signAccess, verifyAccess } from '../../src/utils/token.js';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';

describe('JWT — token round-trip for auth use-case', () => {
  test('valid owner token payload survives sign + verify', () => {
    const payload = { sub: 'owner-id-001', role: 'platform_owner' };
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    assert.equal(decoded.sub, 'owner-id-001');
    assert.equal(decoded.role, 'platform_owner');
  });

  test('ops manager token is correctly encoded', () => {
    const payload = { sub: 'ops-id-002', role: 'operations_manager' };
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    assert.equal(decoded.role, 'operations_manager');
  });

  test('expired token throws TokenExpiredError', async () => {
    // Sign with the same secret that verifyAccess uses (from config, already loaded)
    const shortToken = jwt.sign({ sub: 'u1' }, config.jwt.accessSecret, { expiresIn: '1ms' });
    await new Promise((r) => setTimeout(r, 5));
    assert.throws(() => verifyAccess(shortToken), (e) => e.name === 'TokenExpiredError');
  });

  test('token signed with wrong secret is rejected', () => {
    const badToken = jwt.sign({ sub: 'u1' }, 'totally-wrong-secret');
    assert.throws(() => verifyAccess(badToken), (e) => e.name === 'JsonWebTokenError');
  });
});
