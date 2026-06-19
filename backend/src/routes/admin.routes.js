import { Router } from 'express';
import * as a from '../controllers/admin.controller.js';
import * as analytics from '../controllers/analytics.controller.js';
import * as tasks from '../controllers/task.controller.js';
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
r.get('/chefs/active', a.listActiveChefs);
r.patch('/chefs/:id/review', a.reviewChef);
r.post('/chefs/:id/assign-mentor', a.assignMentor);
r.post('/chefs/:id/generate-certificate', a.generateChefCertificate);
r.post('/chefs/:id/final-approve', a.finalApproveChef);
// Admin user management (owner only)
r.get('/admin-users', authorize(ROLES.OWNER), a.listAdminUsers);
r.post('/admin-users', authorize(ROLES.OWNER), a.addAdminUser);
r.delete('/admin-users/:id', authorize(ROLES.OWNER), a.removeAdminUser);
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
r.get('/analytics/overview', authorize(ROLES.OWNER), analytics.platformOverview);
r.get('/analytics/user-growth', authorize(ROLES.OWNER), analytics.userGrowth);
// Task management (owner + ops — controller handles role-based filtering)
r.get('/tasks', tasks.listTasks);
r.get('/tasks/stats', tasks.taskStats);
r.post('/tasks', tasks.createTask);
r.patch('/tasks/:id', tasks.updateTask);
r.delete('/tasks/:id', authorize(ROLES.OWNER), tasks.deleteTask);
export default r;
