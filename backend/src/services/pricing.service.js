/**
 * Maaswad pricing engine. All rates are configurable via the `settings` collection.
 * Example (defaults): base 200 -> displayed 230, customer total 309, chef receives 180.
 */
export function defaultPricingConfig() {
  return {
    hiddenMarginPct: 15,   // added on top of chef base -> displayed price
    chefCommissionPct: 10, // taken from chef base
    platformFee: 10,       // flat per order
    packingChargePerDish: 20,
    deliveryCharge: 49,
    freeDeliveryThreshold: 1000,
    gstPct: 5,
  };
}

/**
 * @param {Array<{basePrice:number, qty:number}>} items chef base prices
 * @param {object} cfg pricing config
 * @param {object} opts { couponDiscount=0, loyaltyDiscount=0, applyGst=false }
 */
export function computeOrderPricing(items, cfg = defaultPricingConfig(), opts = {}) {
  const { couponDiscount = 0, loyaltyDiscount = 0, applyGst = false } = opts;

  let chefBaseTotal = 0;
  let displayedFoodTotal = 0;
  let totalDishCount = 0;
  const lines = items.map((it) => {
    const qty = it.qty || 1;
    const displayedUnit = round2(it.basePrice * (1 + cfg.hiddenMarginPct / 100));
    chefBaseTotal += it.basePrice * qty;
    displayedFoodTotal += displayedUnit * qty;
    totalDishCount += qty;
    return { basePrice: it.basePrice, qty, displayedUnit, displayedLine: round2(displayedUnit * qty) };
  });

  const packingCharge = cfg.packingChargePerDish * totalDishCount;
  const deliveryCharge = displayedFoodTotal >= cfg.freeDeliveryThreshold ? 0 : cfg.deliveryCharge;
  const platformFee = cfg.platformFee;

  const discounts = round2(couponDiscount + loyaltyDiscount);
  let subtotal = round2(displayedFoodTotal + packingCharge + deliveryCharge + platformFee - discounts);
  const gst = applyGst ? round2(subtotal * (cfg.gstPct / 100)) : 0;
  const customerTotal = round2(subtotal + gst);

  const chefCommission = round2(chefBaseTotal * (cfg.chefCommissionPct / 100));
  const chefReceives = round2(chefBaseTotal - chefCommission);
  const hiddenMarginRevenue = round2(displayedFoodTotal - chefBaseTotal);
  const platformRevenue = round2(hiddenMarginRevenue + chefCommission + platformFee);

  return {
    lines,
    chefBaseTotal: round2(chefBaseTotal),
    displayedFoodTotal: round2(displayedFoodTotal),
    packingCharge, deliveryCharge, platformFee,
    discounts, gst, customerTotal,
    chefCommission, chefReceives,
    breakdown: { hiddenMarginRevenue, chefCommission, platformFee, platformRevenue },
  };
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
