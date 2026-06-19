/**
 * Unit Tests — Pricing Engine
 * Covers: computeOrderPricing · defaultPricingConfig · edge cases
 * Runner: node --test
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeOrderPricing, defaultPricingConfig } from '../../src/services/pricing.service.js';

const DEFAULT = defaultPricingConfig();

// ── Helpers ──────────────────────────────────────────────────────────────────
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
function singleItem(basePrice, qty = 1, cfg = DEFAULT, opts = {}) {
  return computeOrderPricing([{ basePrice, qty }], cfg, opts);
}

// ── 1. defaultPricingConfig ───────────────────────────────────────────────────
describe('defaultPricingConfig', () => {
  test('returns an object with all required keys', () => {
    const keys = ['hiddenMarginPct', 'chefCommissionPct', 'platformFee', 'packingChargePerDish', 'deliveryCharge', 'freeDeliveryThreshold', 'gstPct'];
    keys.forEach((k) => assert.ok(k in DEFAULT, `missing key: ${k}`));
  });

  test('hiddenMarginPct is 15', () => assert.equal(DEFAULT.hiddenMarginPct, 15));
  test('chefCommissionPct is 10', () => assert.equal(DEFAULT.chefCommissionPct, 10));
  test('platformFee is 10', () => assert.equal(DEFAULT.platformFee, 10));
  test('packingChargePerDish is 20', () => assert.equal(DEFAULT.packingChargePerDish, 20));
  test('deliveryCharge is 49', () => assert.equal(DEFAULT.deliveryCharge, 49));
  test('freeDeliveryThreshold is 1000', () => assert.equal(DEFAULT.freeDeliveryThreshold, 1000));
  test('gstPct is 5', () => assert.equal(DEFAULT.gstPct, 5));
});

// ── 2. Single item — base price ₹200 (spec example) ─────────────────────────
describe('computeOrderPricing — single item ₹200', () => {
  const result = singleItem(200);

  test('chefBaseTotal is 200', () => assert.equal(result.chefBaseTotal, 200));

  test('displayedFoodTotal is 230 (200 × 1.15)', () => assert.equal(result.displayedFoodTotal, 230));

  test('packingCharge is 20 (1 dish × ₹20)', () => assert.equal(result.packingCharge, 20));

  test('deliveryCharge is 49 (below free-delivery threshold)', () => assert.equal(result.deliveryCharge, 49));

  test('platformFee is 10', () => assert.equal(result.platformFee, 10));

  test('discounts are 0 (no coupon/loyalty)', () => assert.equal(result.discounts, 0));

  test('gst is 0 (not applied by default)', () => assert.equal(result.gst, 0));

  test('customerTotal is 309 (230+20+49+10)', () => assert.equal(result.customerTotal, 309));

  test('chefCommission is 20 (10% of 200)', () => assert.equal(result.chefCommission, 20));

  test('chefReceives is 180 (200 - 20)', () => assert.equal(result.chefReceives, 180));

  test('hiddenMarginRevenue is 30 (230 - 200)', () => assert.equal(result.breakdown.hiddenMarginRevenue, 30));

  test('platformRevenue is 60 (30 + 20 + 10)', () => assert.equal(result.breakdown.platformRevenue, 60));

  test('returns lines array with one item', () => {
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].basePrice, 200);
    assert.equal(result.lines[0].qty, 1);
    assert.equal(result.lines[0].displayedUnit, 230);
    assert.equal(result.lines[0].displayedLine, 230);
  });
});

// ── 3. Multiple items & quantities ───────────────────────────────────────────
describe('computeOrderPricing — multiple items', () => {
  const items = [{ basePrice: 100, qty: 2 }, { basePrice: 200, qty: 1 }];
  const result = computeOrderPricing(items, DEFAULT);

  test('chefBaseTotal is 400 (100×2 + 200×1)', () => assert.equal(result.chefBaseTotal, 400));

  test('displayedFoodTotal is 460 (115×2 + 230×1)', () => assert.equal(result.displayedFoodTotal, 460));

  test('packingCharge is 60 (3 dishes × ₹20)', () => assert.equal(result.packingCharge, 60));

  test('returns 2 line items', () => assert.equal(result.lines.length, 2));

  test('first line displayedLine is 230 (115 × 2)', () => assert.equal(result.lines[0].displayedLine, 230));

  test('second line displayedLine is 230 (230 × 1)', () => assert.equal(result.lines[1].displayedLine, 230));

  test('chefReceives is 360 (400 - 10% of 400)', () => assert.equal(result.chefReceives, 360));
});

// ── 4. Free delivery threshold ────────────────────────────────────────────────
describe('computeOrderPricing — free delivery', () => {
  test('delivery is free when displayedFoodTotal >= 1000', () => {
    // basePrice 900 × 1 → displayed 900×1.15 = 1035 ≥ 1000
    const result = singleItem(900);
    assert.equal(result.deliveryCharge, 0);
  });

  test('delivery is ₹49 just below threshold (displayed 999)', () => {
    // basePrice 869 → displayed 869×1.15 = 999.35, below 1000
    const result = singleItem(869);
    assert.equal(result.deliveryCharge, 49);
  });

  test('delivery is free at exactly 1000 (basePrice 870 → 1000.5)', () => {
    const result = singleItem(870);
    assert.ok(result.displayedFoodTotal >= 1000);
    assert.equal(result.deliveryCharge, 0);
  });
});

// ── 5. GST ───────────────────────────────────────────────────────────────────
describe('computeOrderPricing — GST', () => {
  test('gst is 0 when applyGst is false (default)', () => {
    const result = singleItem(200, 1, DEFAULT, { applyGst: false });
    assert.equal(result.gst, 0);
  });

  test('gst is applied at 5% when applyGst:true', () => {
    const result = singleItem(200, 1, DEFAULT, { applyGst: true });
    // subtotal = 309, gst = 309 × 0.05 = 15.45
    assert.equal(result.gst, 15.45);
    assert.equal(result.customerTotal, r2(309 + 15.45));
  });
});

// ── 6. Discounts ─────────────────────────────────────────────────────────────
describe('computeOrderPricing — discounts', () => {
  test('coupon discount reduces customerTotal', () => {
    const without = singleItem(200);
    const with50 = singleItem(200, 1, DEFAULT, { couponDiscount: 50 });
    assert.equal(with50.customerTotal, without.customerTotal - 50);
    assert.equal(with50.discounts, 50);
  });

  test('loyalty discount reduces customerTotal', () => {
    const without = singleItem(200);
    const with20 = singleItem(200, 1, DEFAULT, { loyaltyDiscount: 20 });
    assert.equal(with20.customerTotal, without.customerTotal - 20);
  });

  test('combined discounts stack correctly', () => {
    const result = singleItem(200, 1, DEFAULT, { couponDiscount: 30, loyaltyDiscount: 20 });
    assert.equal(result.discounts, 50);
    assert.equal(result.customerTotal, 309 - 50);
  });

  test('zero discounts by default', () => {
    const result = singleItem(200);
    assert.equal(result.discounts, 0);
  });
});

// ── 7. Custom config ──────────────────────────────────────────────────────────
describe('computeOrderPricing — custom config', () => {
  test('zero commission config — chef keeps full base price', () => {
    const cfg = { ...DEFAULT, chefCommissionPct: 0 };
    const result = singleItem(200, 1, cfg);
    assert.equal(result.chefCommission, 0);
    assert.equal(result.chefReceives, 200);
  });

  test('zero hidden margin — displayed price equals base price', () => {
    const cfg = { ...DEFAULT, hiddenMarginPct: 0 };
    const result = singleItem(200, 1, cfg);
    assert.equal(result.displayedFoodTotal, 200);
  });

  test('higher margin config changes customer total', () => {
    const cfg = { ...DEFAULT, hiddenMarginPct: 20 };
    const result = singleItem(200, 1, cfg);
    // 200 × 1.20 = 240
    assert.equal(result.displayedFoodTotal, 240);
  });

  test('zero platform fee reduces customer total by 10', () => {
    const cfg = { ...DEFAULT, platformFee: 0 };
    const result = singleItem(200, 1, cfg);
    const base = singleItem(200);
    assert.equal(result.customerTotal, base.customerTotal - 10);
  });

  test('zero packing charge reduces total by (dishes × 20)', () => {
    const cfg = { ...DEFAULT, packingChargePerDish: 0 };
    const result = singleItem(200, 1, cfg);
    const base = singleItem(200);
    assert.equal(result.customerTotal, base.customerTotal - 20);
  });
});

// ── 8. Edge cases ─────────────────────────────────────────────────────────────
describe('computeOrderPricing — edge cases', () => {
  test('empty items array returns zero totals', () => {
    const result = computeOrderPricing([], DEFAULT);
    assert.equal(result.chefBaseTotal, 0);
    assert.equal(result.displayedFoodTotal, 0);
    assert.equal(result.chefReceives, 0);
    assert.equal(result.lines.length, 0);
  });

  test('very large order (qty 100, price 500)', () => {
    const result = singleItem(500, 100);
    assert.equal(result.chefBaseTotal, 50000);
    assert.equal(result.displayedFoodTotal, 57500); // 500×1.15×100
    assert.equal(result.deliveryCharge, 0); // well above threshold
  });

  test('fractional base prices produce rounded results', () => {
    const result = singleItem(99.99);
    // 99.99 × 1.15 = 114.9885 → rounds to 114.99
    assert.equal(result.displayedFoodTotal, 114.99);
    assert.equal(typeof result.customerTotal, 'number');
    // should not have more than 2 decimal places
    assert.ok(String(result.customerTotal).split('.')[1]?.length <= 2 ?? true);
  });

  test('qty=0 treated same as qty=1 (fallback)', () => {
    const result = computeOrderPricing([{ basePrice: 100, qty: 0 }], DEFAULT);
    // qty=0 || 1 = 1
    assert.equal(result.chefBaseTotal, 100);
  });

  test('result has all expected top-level keys', () => {
    const result = singleItem(100);
    const keys = ['lines', 'chefBaseTotal', 'displayedFoodTotal', 'packingCharge',
      'deliveryCharge', 'platformFee', 'discounts', 'gst', 'customerTotal',
      'chefCommission', 'chefReceives', 'breakdown'];
    keys.forEach((k) => assert.ok(k in result, `missing key: ${k}`));
  });
});
