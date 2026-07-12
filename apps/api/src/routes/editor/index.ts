import { Router } from 'express';

// Import all route modules
import authRoutes from './auth.routes.js';
import adsRoutes from './ads.routes.js';
import usersRoutes from './users.routes.js';
import verificationsRoutes from './verifications.routes.js';
import editorsRoutes from './editors.routes.js';
import statsRoutes from './stats.routes.js';
import reportsRoutes from './reports.routes.js';
import categoriesRoutes from './categories.routes.js';
import notificationsRoutes from './notifications.routes.js';
import templatesRoutes from './templates.routes.js';
import { authenticateToken, requireEditorOrAdmin, requireActiveStaff } from '../../middleware/auth.js';

const router = Router();

// Auth routes: /auth/login (login must stay public; /profile self-authenticates)
router.use('/auth', authRoutes);

// Profile route is directly on auth routes
router.use('/', authRoutes);

// 🔒 ACL-1: Authorize EVERY route below as editor/admin/super_admin.
// authenticateToken alone only proves identity — regular user tokens are signed
// with the same JWT_SECRET and would otherwise reach all editor/admin handlers.
// 🔒 API-2: requireActiveStaff re-checks is_active + role in the DB per request,
// so suspending/demoting a staff member takes effect immediately (not at token expiry).
router.use(authenticateToken, requireEditorOrAdmin, requireActiveStaff);

// Stats routes: /stats (main), /notifications/count, /system-alerts, /avg-response-time, /trends, /support-chat/count, /avg-response-time/trend, /my-work-today
router.use('/', statsRoutes);

// Ads routes: /ads, /ads/:id/*, etc.
router.use('/ads', adsRoutes);

// Users routes: /users, /users/:id/*
router.use('/users', usersRoutes);

// Verifications routes: /verifications, /verifications/:id/*
router.use('/verifications', verificationsRoutes);

// Editors management routes: /editors, /editors/:id/*
router.use('/editors', editorsRoutes);

// Reports routes: /user-reports/*, /reported-ads, /reports/:id/dismiss
router.use('/', reportsRoutes);

// Categories routes: /categories, /categories/:id
router.use('/categories', categoriesRoutes);

// Notifications routes: /notifications/broadcast, /notifications/schedule, /notifications/scheduled
router.use('/notifications', notificationsRoutes);

// Response templates routes: /templates (list/create/update/delete/:id/use)
router.use('/templates', templatesRoutes);

export default router;
