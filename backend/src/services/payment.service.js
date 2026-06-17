import config from '../config/index.js';
import Payment from '../models/Payment.js';

/**
 * Payment gateway abstraction. Phase 1 uses a dummy provider that always
 * succeeds. Razorpay/UPI providers can be added here without touching callers.
 */
const providers = {
  dummy: {
    async createIntent({ amount, currency = 'INR' }) {
      return { providerOrderId: `dummy_${Date.now()}`, amount, currency };
    },
    async confirm({ providerOrderId }) {
      return { status: 'success', providerPaymentId: `pay_${providerOrderId}` };
    },
  },
  // razorpay: { createIntent(){...}, confirm(){...} }  // future
};

export function getProvider() {
  return providers[config.payment.provider] || providers.dummy;
}

export async function initiatePayment({ order, customer, amount }) {
  const provider = getProvider();
  const intent = await provider.createIntent({ amount });
  const payment = await Payment.create({
    order, customer, provider: config.payment.provider, providerOrderId: intent.providerOrderId,
    amount, status: 'pending',
  });
  return { payment, intent };
}

export async function confirmPayment(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  const provider = getProvider();
  const result = await provider.confirm({ providerOrderId: payment.providerOrderId });
  payment.status = result.status;
  payment.providerPaymentId = result.providerPaymentId;
  payment.method = config.payment.provider;
  await payment.save();
  return payment;
}
