import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import session from 'express-session';
import config from './config/index.js';
import passport from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { httpLoggerMiddleware } from './lib/logger.js';
import { prisma } from '@thulobazaar/database';

// Import routes (will be added as we migrate them)
import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import adsRoutes from './routes/ads.routes.js';
import profileRoutes from './routes/profile.routes.js';
import shopRoutes from './routes/shop.routes.js';
import searchRoutes from './routes/search.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import editorRoutes from './routes/editor/index.js';
import verificationRoutes from './routes/verification.routes.js';
import areasRoutes from './routes/areas.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import mockPaymentRoutes from './routes/mockPayment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import categoryPricingTiersRoutes from './routes/categoryPricingTiers.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import announcementsRoutes from './routes/announcements.routes.js';
import supportRoutes from './routes/support.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import blogRoutes from './routes/blog.routes.js';

export function createApp(): Express {
  const app = express();

  // Security middleware - Helmet for HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            config.FRONTEND_URL,
            config.BACKEND_URL,
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // HTTP request logging (Morgan → Winston)
  app.use(httpLoggerMiddleware);

  // CORS configuration
  // No-origin requests (mobile apps, native clients) are allowed only on safe read methods.
  // State-changing methods (POST/PUT/PATCH/DELETE) require a validated Origin header.
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          // Allow origin-less requests only if the method is safe (set per-request below)
          return callback(null, true);
        }
        if (config.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  // Reject no-origin requests on state-changing methods (CSRF protection for browser clients)
  app.use((req, res, next) => {
    if (!req.headers.origin && !SAFE_METHODS.has(req.method)) {
      // Auth routes are exempt: login/register produce the token, so no Bearer exists yet
      const isAuthRoute = req.path.startsWith('/api/auth/') || req.path.startsWith('/auth/');
      // Allow if request carries a valid Bearer token (native mobile app)
      const hasBearer = req.headers.authorization?.startsWith('Bearer ');
      if (!isAuthRoute && !hasBearer) {
        res.status(403).json({ success: false, message: 'Forbidden: Origin header required' });
        return;
      }
    }
    next();
  });

  // Session middleware for Passport
  app.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files statically with CORS headers
  const uploadsPath = path.resolve(config.UPLOAD_DIR);
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      next();
    },
    express.static(uploadsPath)
  );

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
  });

  // Test endpoint
  app.get('/api/test', (_req, res) => {
    res.json({ success: true, message: 'Thulo Bazaar API v2 (TypeScript)' });
  });

  // Maintenance mode: block write operations for non-staff users
  // GET/HEAD/OPTIONS are always allowed so the app remains browsable
  app.use('/api', async (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Exempt auth routes (login/OTP) so staff can still log in
    if (req.path.startsWith('/auth/')) return next();
    // Exempt editor/admin routes (staff actions)
    if (req.path.startsWith('/editor/') || req.path.startsWith('/admin/')) return next();
    // Exempt health/internal endpoints
    if (req.path === '/health' || req.path.startsWith('/internal/')) return next();

    try {
      const setting = await prisma.site_settings.findUnique({
        where: { setting_key: 'maintenance_mode' },
        select: { setting_value: true },
      });
      if (setting?.setting_value === 'true') {
        return res.status(503).json({
          success: false,
          message: 'Thulo Bazaar is currently under maintenance. Please try again later.',
        });
      }
    } catch {
      // If DB check fails, don't block — allow request through
    }
    next();
  });

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/locations', locationsRoutes);
  app.use('/api/ads', adsRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/profiles', profileRoutes); // Alias
  app.use('/api/shop', shopRoutes);
  app.use('/api/seller', shopRoutes); // Alias
  app.use('/api/search', searchRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/editor', editorRoutes);
  app.use('/api/admin', editorRoutes); // Admin uses same routes as editor
  app.use('/api/verification', verificationRoutes);
  app.use('/api/areas', areasRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/promotion-pricing', promotionRoutes);
  app.use('/api/mock-payment', mockPaymentRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/category-pricing-tiers', categoryPricingTiersRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/announcements', announcementsRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/blog', blogRoutes);

  // Public endpoint: Ad configuration for web + mobile
  app.get('/api/ad-config', async (_req, res) => {
    try {
      const settings = await prisma.site_settings.findMany({
        where: {
          setting_key: {
            in: [
              'google_ads_enabled', 'adsense_client_id',
              'ad_slot_home_hero_banner', 'ad_slot_home_hero_banner_mobile',
              'ad_slot_home_left', 'ad_slot_home_right',
              'ad_slot_home_in_feed', 'ad_slot_home_bottom',
              'ad_slot_ad_detail_top', 'ad_slot_ad_detail_top_mobile',
              'ad_slot_ad_detail_left', 'ad_slot_ad_detail_right', 'ad_slot_ad_detail_bottom',
              'ad_slot_ads_listing_top', 'ad_slot_ads_listing_top_mobile',
              'ad_slot_ads_listing_sidebar', 'ad_slot_ads_listing_in_feed', 'ad_slot_ads_listing_bottom',
              'ad_slot_search_top', 'ad_slot_search_top_mobile',
              'ad_slot_search_sidebar', 'ad_slot_search_in_results', 'ad_slot_search_bottom',
              'ad_slot_dashboard_sidebar', 'ad_slot_profile_sidebar',
              'admob_app_id_android', 'admob_app_id_ios',
              'admob_banner_android', 'admob_banner_ios',
            ],
          },
        },
      });

      const map: Record<string, string> = {};
      for (const s of settings) {
        map[s.setting_key] = s.setting_value || '';
      }

      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({
        enabled: map.google_ads_enabled === 'true',
        web: {
          clientId: map.adsense_client_id || '',
          slots: {
            homeHeroBanner: map.ad_slot_home_hero_banner || '',
            homeHeroBannerMobile: map.ad_slot_home_hero_banner_mobile || '',
            homeLeft: map.ad_slot_home_left || '',
            homeRight: map.ad_slot_home_right || '',
            homeInFeed: map.ad_slot_home_in_feed || '',
            homeBottom: map.ad_slot_home_bottom || '',
            adDetailTop: map.ad_slot_ad_detail_top || '',
            adDetailTopMobile: map.ad_slot_ad_detail_top_mobile || '',
            adDetailLeft: map.ad_slot_ad_detail_left || '',
            adDetailRight: map.ad_slot_ad_detail_right || '',
            adDetailBottom: map.ad_slot_ad_detail_bottom || '',
            adsListingTop: map.ad_slot_ads_listing_top || '',
            adsListingTopMobile: map.ad_slot_ads_listing_top_mobile || '',
            adsListingSidebar: map.ad_slot_ads_listing_sidebar || '',
            adsListingInFeed: map.ad_slot_ads_listing_in_feed || '',
            adsListingBottom: map.ad_slot_ads_listing_bottom || '',
            searchTop: map.ad_slot_search_top || '',
            searchTopMobile: map.ad_slot_search_top_mobile || '',
            searchSidebar: map.ad_slot_search_sidebar || '',
            searchInResults: map.ad_slot_search_in_results || '',
            searchBottom: map.ad_slot_search_bottom || '',
            dashboardSidebar: map.ad_slot_dashboard_sidebar || '',
            profileSidebar: map.ad_slot_profile_sidebar || '',
          },
        },
        mobile: {
          android: { appId: map.admob_app_id_android || '', bannerUnitId: map.admob_banner_android || '' },
          ios: { appId: map.admob_app_id_ios || '', bannerUnitId: map.admob_banner_ios || '' },
        },
      });
    } catch (error) {
      console.error('Ad config fetch error:', error);
      res.status(500).json({ enabled: false, web: { clientId: '', slots: {} }, mobile: { android: {}, ios: {} } });
    }
  });

  // Public endpoint: App status (maintenance mode check for Flutter)
  app.get('/api/app-status', async (_req, res) => {
    try {
      const setting = await prisma.site_settings.findUnique({
        where: { setting_key: 'maintenance_mode' },
        select: { setting_value: true },
      });
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        success: true,
        maintenance: setting?.setting_value === 'true',
      });
    } catch {
      res.json({ success: true, maintenance: false });
    }
  });

  // Public endpoint: Ad limits for web + mobile
  app.get('/api/ad-limits', async (req, res) => {
    try {
      const { getAdLimits, getImageLimitForUser } = await import('./services/adLimits.service.js');
      const limits = await getAdLimits();

      // If authenticated, include user-specific image limit
      let userImageLimit: number | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const { authenticateToken } = await import('./middleware/auth.js');
          await new Promise<void>((resolve, reject) => {
            authenticateToken(req as any, res as any, (err: any) => err ? reject(err) : resolve());
          });
          const userId = (req as any).user?.userId;
          if (userId) {
            userImageLimit = await getImageLimitForUser(userId);
          }
        } catch {
          // Not authenticated — skip user-specific limit
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({
        success: true,
        data: {
          maxAdsPerUser: limits.maxAdsPerUser,
          adExpiryDays: limits.adExpiryDays,
          freeAdsLimit: limits.freeAdsLimit,
          maxImagesPerAd: limits.maxImagesPerAd,
          maxImagesVerified: limits.maxImagesVerified,
          maxImagesUnverified: limits.maxImagesUnverified,
          ...(userImageLimit !== undefined && { userImageLimit }),
        },
      });
    } catch (error) {
      console.error('Ad limits fetch error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch ad limits' });
    }
  });

  // Internal endpoint: Next.js → Express Socket.IO bridge
  // Called by Next.js API routes after saving a message to DB
  app.post('/api/internal/broadcast-message', (req, res) => {
    const { secret, messageData, conversationId } = req.body;

    // Simple shared secret to prevent unauthorized broadcasts
    const internalSecret = process.env.INTERNAL_API_SECRET || 'thulobazaar-internal-2025';
    if (secret !== internalSecret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const io = req.app.get('io');
    if (io && conversationId) {
      io.to(`conversation:${conversationId}`).emit('message:new', messageData);
      io.to(`conversation:${conversationId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: messageData,
        timestamp: new Date(),
      });
      console.log(`📡 Broadcasted message ${messageData?.id} to conversation:${conversationId}`);
      return res.json({ success: true });
    }

    return res.status(500).json({ success: false, message: 'Socket.IO not available' });
  });

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
}
