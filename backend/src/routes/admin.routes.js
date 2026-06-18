import { Router } from 'express';
import * as a from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
const r = Router();
r.use(authenticate, authorize(ROLES.OWNER, ROLES.OPS));
// Certificate registry (Super Admin / Owner only)
r.get('/certificates', a.listCertificates);
r.post('/certificates', authorize(ROLES.OWNER), a.addCertificate);
r.delete('/certificates/:id', authorize(ROLES.OWNER), a.deleteCertificate);
// Chef management
r.get('/chefs', a.listChefs);
r.patch('/chefs/:id/review', a.reviewChef);
// Dish management
r.get('/dishes', a.listDishesAdmin);
r.patch('/dishes/:id/review', a.reviewDish);
// Customer management
r.get('/customers', a.listCustomers);
r.patch('/customers/:id/status', a.suspendUser);
// Delivery management
r.get('/delivery-partners', a.listDeliveryPartners);
r.patch('/delivery-partners/:id/review', a.reviewDeliveryPartner);
// Orders
r.get('/orders', a.listOrders);
r.post('/orders/:id/assign', a.assignRider); // legacy (in-house rider)
r.post('/orders/:id/dispatch', a.dispatchOrder); // third-party delivery
// Coupons
r.get('/coupons', a.listCoupons);
r.post('/coupons', a.createCoupon);
r.patch('/coupons/:id', a.updateCoupon);
// Reviews moderation
r.patch('/reviews/:id/moderate', a.moderateReview);
// Financial
r.get('/revenue', a.revenueDashboard);
r.get('/settlements', a.listSettlements);
r.post('/settlements/run', a.runSettlements);
r.post('/settlements/generate', a.generateChefSettlement);
// Settings (owner + ops)
r.get('/settings', a.getPlatformSettings);
r.patch('/settings', a.patchPlatformSettings);
// Owner-only analytics + audit
r.get('/audit-logs', authorize(ROLES.OWNER), a.auditLogs);
r.get('/analytics/users', authorize(ROLES.OWNER), a.userAnalytics);
export default r;
