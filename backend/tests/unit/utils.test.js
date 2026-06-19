/**
 * Unit Tests — Utility modules
 * Covers: ApiError · apiResponse · otp · token (JWT)
 * Runner: node --test (Node 18+ built-in, no extra deps)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// ── 1. ApiError ──────────────────────────────────────────────────────────────
import ApiError from '../../src/utils/ApiError.js';

describe('ApiError', () => {
  test('constructor sets statusCode, message, isOperational', () => {
    const e = new ApiError(400, 'bad input');
    assert.equal(e.statusCode, 400);
    assert.equal(e.message, 'bad input');
    assert.equal(e.isOperational, true);
    assert.ok(e instanceof Error);
  });

  test('constructor stores optional details', () => {
    const e = new ApiError(422, 'validation failed', { field: 'email' });
    assert.deepEqual(e.details, { field: 'email' });
  });

  test('static badRequest returns 400', () => {
    const e = ApiError.badRequest('nope');
    assert.equal(e.statusCode, 400);
    assert.equal(e.message, 'nope');
  });

  test('static unauthorized returns 401 with default message', () => {
    const e = ApiError.unauthorized();
    assert.equal(e.statusCode, 401);
    assert.equal(e.message, 'Unauthorized');
  });

  test('static unauthorized accepts custom message', () => {
    const e = ApiError.unauthorized('Token expired');
    assert.equal(e.message, 'Token expired');
  });

  test('static forbidden returns 403', () => {
    const e = ApiError.forbidden('Insufficient role');
    assert.equal(e.statusCode, 403);
    assert.equal(e.message, 'Insufficient role');
  });

  test('static notFound returns 404 with default message', () => {
    const e = ApiError.notFound();
    assert.equal(e.statusCode, 404);
    assert.equal(e.message, 'Not found');
  });

  test('static notFound accepts custom message', () => {
    const e = ApiError.notFound('Chef not found');
    assert.equal(e.message, 'Chef not found');
  });

  test('static conflict returns 409', () => {
    const e = ApiError.conflict('Duplicate entry');
    assert.equal(e.statusCode, 409);
    assert.equal(e.message, 'Duplicate entry');
  });

  test('inherits from Error — stack trace captured', () => {
    const e = new ApiError(500, 'server error');
    assert.ok(e.stack, 'stack should be present');
    assert.ok(e.stack.includes('ApiError'));
  });

  test('each static factory returns a different ApiError instance', () => {
    const e1 = ApiError.badRequest('a');
    const e2 = ApiError.notFound('b');
    assert.notEqual(e1.statusCode, e2.statusCode);
    assert.ok(e1 !== e2);
  });
});

// ── 2. apiResponse ───────────────────────────────────────────────────────────
import { ok, created } from '../../src/utils/apiResponse.js';

describe('apiResponse', () => {
  function mockRes() {
    let _status = null;
    let _body = null;
    return {
      status(code) { _status = code; return this; },
      json(body) { _body = body; return this; },
      get statusCode() { return _status; },
      get body() { return _body; },
    };
  }

  test('ok() sends 200 with success:true', () => {
    const res = mockRes();
    ok(res, { id: 1 });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, { id: 1 });
  });

  test('ok() uses default message "OK"', () => {
    const res = mockRes();
    ok(res, null);
    assert.equal(res.body.message, 'OK');
  });

  test('ok() accepts custom message', () => {
    const res = mockRes();
    ok(res, [], 'Fetched successfully');
    assert.equal(res.body.message, 'Fetched successfully');
  });

  test('ok() attaches meta when provided', () => {
    const res = mockRes();
    ok(res, [], 'OK', { total: 50, page: 1, pages: 5 });
    assert.deepEqual(res.body.meta, { total: 50, page: 1, pages: 5 });
  });

  test('ok() omits meta key when not provided', () => {
    const res = mockRes();
    ok(res, []);
    assert.equal(res.body.meta, undefined);
  });

  test('created() sends 201 with success:true', () => {
    const res = mockRes();
    created(res, { _id: 'abc' });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, { _id: 'abc' });
  });

  test('created() uses default message "Created"', () => {
    const res = mockRes();
    created(res, {});
    assert.equal(res.body.message, 'Created');
  });

  test('created() accepts custom message', () => {
    const res = mockRes();
    created(res, {}, 'Application submitted');
    assert.equal(res.body.message, 'Application submitted');
  });
});

// ── 3. OTP utilities ─────────────────────────────────────────────────────────
import { generateOtp, otpExpiry } from '../../src/utils/otp.js';

describe('OTP utilities', () => {
  test('generateOtp() returns a 6-digit string', () => {
    const otp = generateOtp();
    assert.equal(typeof otp, 'string');
    assert.equal(otp.length, 6);
  });

  test('generateOtp() only contains digits', () => {
    for (let i = 0; i < 20; i++) {
      assert.match(generateOtp(), /^\d{6}$/);
    }
  });

  test('generateOtp() produces values between 100000 and 999999', () => {
    for (let i = 0; i < 50; i++) {
      const n = parseInt(generateOtp(), 10);
      assert.ok(n >= 100000 && n <= 999999, `OTP ${n} out of range`);
    }
  });

  test('generateOtp() is not always the same (random)', () => {
    const results = new Set(Array.from({ length: 20 }, generateOtp));
    assert.ok(results.size > 1, 'OTPs should not all be identical');
  });

  test('otpExpiry() returns a Date', () => {
    assert.ok(otpExpiry() instanceof Date);
  });

  test('otpExpiry() default is ~10 minutes in the future', () => {
    const before = Date.now();
    const expiry = otpExpiry();
    const after = Date.now();
    const diffMs = expiry.getTime() - before;
    assert.ok(diffMs >= 9 * 60 * 1000 && diffMs <= 10 * 60 * 1000 + (after - before));
  });

  test('otpExpiry(5) is ~5 minutes in the future', () => {
    const expiry = otpExpiry(5);
    const diff = expiry.getTime() - Date.now();
    assert.ok(diff >= 4.9 * 60 * 1000 && diff <= 5.1 * 60 * 1000);
  });

  test('otpExpiry(30) is ~30 minutes in the future', () => {
    const expiry = otpExpiry(30);
    const diff = expiry.getTime() - Date.now();
    assert.ok(diff >= 29.9 * 60 * 1000 && diff <= 30.1 * 60 * 1000);
  });
});

// ── 4. JWT token utilities ────────────────────────────────────────────────────
// We set env vars before importing so config picks them up.
process.env.JWT_ACCESS_SECRET = 'test-access-secret-maaswad-2024';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-maaswad-2024';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.NODE_ENV = 'test';

import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../../src/utils/token.js';
import jwt from 'jsonwebtoken';

describe('JWT token utilities', () => {
  const payload = { sub: 'user123', role: 'food_lover' };

  test('signAccess() returns a non-empty string', () => {
    const token = signAccess(payload);
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 10);
  });

  test('signRefresh() returns a non-empty string', () => {
    const token = signRefresh(payload);
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 10);
  });

  test('verifyAccess() decodes a valid access token', () => {
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    assert.equal(decoded.sub, 'user123');
    assert.equal(decoded.role, 'food_lover');
  });

  test('verifyRefresh() decodes a valid refresh token', () => {
    const token = signRefresh(payload);
    const decoded = verifyRefresh(token);
    assert.equal(decoded.sub, 'user123');
  });

  test('access token has iat and exp fields', () => {
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    assert.ok(decoded.iat, 'should have issued-at');
    assert.ok(decoded.exp, 'should have expiry');
    assert.ok(decoded.exp > decoded.iat);
  });

  test('verifyAccess() throws JsonWebTokenError for tampered token', () => {
    const token = signAccess(payload) + 'tampered';
    assert.throws(() => verifyAccess(token), (e) => e.name === 'JsonWebTokenError');
  });

  test('verifyAccess() throws for token signed with wrong secret', () => {
    const badToken = jwt.sign(payload, 'wrong-secret');
    assert.throws(() => verifyAccess(badToken));
  });

  test('access and refresh tokens are different strings', () => {
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    assert.notEqual(access, refresh);
  });

  test('two access tokens for same payload differ (iat jitter)', async () => {
    const t1 = signAccess(payload);
    await new Promise((r) => setTimeout(r, 1001));
    const t2 = signAccess(payload);
    assert.notEqual(t1, t2);
  });
});
