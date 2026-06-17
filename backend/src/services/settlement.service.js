import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import { getSettings } from './settings.service.js';

/**
 * Marks delivered orders settlement-eligible once the chef release window
 * has passed OR the customer has confirmed + reviewed.
 */
export async function processSettlementEligibility() {
  const settings = await getSettings();
  const hours = settings.settlement?.chefReleaseHours ?? 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const orders = await Order.find({
    status: { $in: ['delivered', 'customer_confirmed', 'reviewed'] },
    settlementEligibleAt: { $exists: false },
    $or: [{ status: 'reviewed' }, { deliveredAt: { $lte: cutoff } }],
  });
  for (const o of orders) {
    o.settlementEligibleAt = new Date();
    o.status = 'settlement_eligible';
    o.timeline.push({ status: 'settlement_eligible' });
    await o.save();
  }
  return orders.length;
}

export async function buildChefSettlement(chefId, from, to) {
  const orders = await Order.find({
    chef: chefId, status: 'settlement_eligible',
    settlementEligibleAt: { $gte: from, $lte: to },
  });
  const grossSales = orders.reduce((s, o) => s + (o.pricing?.chefBaseTotal || 0), 0);
  const platformCommission = orders.reduce((s, o) => s + (o.pricing?.chefCommission || 0), 0);
  const netEarnings = grossSales - platformCommission;
  return Settlement.create({
    payeeType: 'chef', chef: chefId, orders: orders.map((o) => o._id),
    grossSales, platformCommission, netEarnings, period: { from, to },
    status: 'eligible', payoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}
