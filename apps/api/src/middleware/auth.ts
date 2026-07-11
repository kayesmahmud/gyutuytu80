import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { AuthenticationError } from './errorHandler.js';
import { logger } from '../lib/logger.js';

interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    next(new AuthenticationError('Access token required'));
    return;
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.debug('[Auth] Token verification failed', { error: err.message });
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }

    const user = decoded as JwtPayload;
    logger.debug('[Auth] Token verified', { userId: user.userId, role: user.role });
    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
    next();
  });
};

/**
 * Check if user is admin
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    next(new AuthenticationError('Admin access required'));
    return;
  }
  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      const user = decoded as JwtPayload;
      req.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };
    }
    next();
  });
};

/**
 * Require regular user (not editor or admin)
 */
export const requireRegularUser = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === 'editor' || req.user?.role === 'super_admin') {
    next(new AuthenticationError('This feature is not available for editors and admins'));
    return;
  }
  next();
};

/**
 * Require editor, admin, or super_admin role
 */
export const requireEditorOrAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  if (role !== 'editor' && role !== 'admin' && role !== 'super_admin') {
    next(new AuthenticationError('Editor or admin access required'));
    return;
  }
  next();
};

/**
 * 🔒 API-2: Re-check that a STAFF account is still active on every staff request.
 * JWTs live for 24h, so without this a suspended editor's token keeps working
 * until expiry. Scoped to staff routes only (mounted on the editor router), so
 * public traffic pays no per-request DB cost.
 */
export const requireActiveStaff = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const userId = req.user?.userId;
  if (!userId) {
    next(new AuthenticationError('Access token required'));
    return;
  }

  prisma.users
    .findUnique({ where: { id: userId }, select: { is_active: true, role: true } })
    .then((user) => {
      if (!user || !user.is_active) {
        next(new AuthenticationError('Account is deactivated'));
        return;
      }
      // The DB role is authoritative — a demoted staff member's old token must
      // not keep working for the remainder of its lifetime.
      if (!['editor', 'admin', 'super_admin'].includes(user.role || '')) {
        next(new AuthenticationError('Editor or admin access required'));
        return;
      }
      next();
    })
    .catch(next);
};

/**
 * Require super_admin role only
 */
export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'super_admin') {
    next(new AuthenticationError('Super admin access required'));
    return;
  }
  next();
};
