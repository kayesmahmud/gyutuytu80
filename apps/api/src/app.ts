import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import session from 'express-session';
import config from './config/index.js';
import passport from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

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

  // CORS configuration - function-based to allow mobile apps (no Origin header)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Check against allowed origins list
        if (config.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

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
    res.json({ success: true, message: 'ThuluBazaar API v2 (TypeScript)' });
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
