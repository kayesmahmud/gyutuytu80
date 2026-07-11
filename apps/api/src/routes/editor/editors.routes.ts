import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma, Prisma } from '@thulobazaar/database';
import { catchAsync, ValidationError, AuthenticationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';
import { SECURITY } from '../../config/constants.js';
import { uploadAvatar } from '../../middleware/upload.js';
import { optimizeImage } from '../../middleware/optimizeImage.js';

const router = Router();

/**
 * GET /api/editor/editors
 * Get list of all editors (super admin only)
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const editors = await prisma.users.findMany({
      where: {
        role: 'editor',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        two_factor_enabled: true,
        avatar: true,
        last_login: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: editors.map((editor) => ({
        id: editor.id,
        full_name: editor.full_name,
        email: editor.email,
        role: editor.role,
        is_active: editor.is_active,
        two_factor_enabled: editor.two_factor_enabled,
        avatar: editor.avatar,
        last_login: editor.last_login,
        created_at: editor.created_at,
        total_actions: 0,
      })),
    });
  })
);

/**
 * POST /api/editor/editors
 * Create a new editor (super admin only)
 */
router.post(
  '/',
  authenticateToken,
  uploadAvatar.single('avatar'),
  optimizeImage('avatar'),
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { fullName, email, password } = req.body;

    console.log('📝 Creating editor:', { fullName, email, hasPassword: !!password });
    console.log('📁 Uploaded file:', req.file);

    if (!fullName || !email || !password) {
      throw new ValidationError('Full name, email, and password are required');
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

    const createData: Record<string, unknown> = {
      full_name: fullName,
      email,
      password_hash: passwordHash,
      role: 'editor',
      is_active: true,
    };

    if (req.file) {
      createData.avatar = req.file.filename;
      console.log('📷 Avatar uploaded:', req.file.filename);
    }

    const newEditor = await prisma.users.create({
      data: createData as any,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        avatar: true,
        created_at: true,
      },
    });

    console.log(`✅ New editor created: ${email}${req.file ? ' (with avatar)' : ''}`);

    res.status(201).json({
      success: true,
      message: 'Editor created successfully',
      data: newEditor,
    });
  })
);

/**
 * PUT /api/editor/editors/:id
 * Update an editor (super admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  uploadAvatar.single('avatar'),
  optimizeImage('avatar'),
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;
    const { fullName, email, password, isActive } = req.body;

    console.log('📝 Updating editor:', {
      id,
      fullName,
      email,
      password: password ? `[${typeof password}:${password.length}chars]` : 'not provided',
      isActive
    });
    console.log('📁 Uploaded file:', req.file);

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData.full_name = fullName;
    if (email) updateData.email = email;
    if (typeof isActive === 'boolean') {
      updateData.is_active = isActive;
    } else if (isActive === 'true' || isActive === 'false') {
      updateData.is_active = isActive === 'true';
    }

    const passwordStr = password?.toString().trim();
    if (passwordStr && passwordStr.length > 0 && passwordStr !== 'undefined') {
      updateData.password_hash = await bcrypt.hash(passwordStr, SECURITY.BCRYPT_SALT_ROUNDS);
    }

    if (req.file) {
      updateData.avatar = req.file.filename;
      console.log('📷 Avatar uploaded:', req.file.filename);
    }

    // 🔒 API-M3: only editor accounts may be managed here — never another
    // admin/super_admin or a regular user.
    const updatedEditor = await prisma.users.update({
      where: { id: parseInt(id), role: 'editor' },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        avatar: true,
        created_at: true,
      },
    });

    console.log(`✅ Editor updated: ${updatedEditor.email}`);

    res.json({
      success: true,
      message: 'Editor updated successfully',
      data: updatedEditor,
    });
  })
);

/**
 * DELETE /api/editor/editors/:id
 * Delete an editor (super admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;

    // 🔒 API-M3: only editor accounts may be deleted here.
    await prisma.users.delete({
      where: { id: parseInt(id), role: 'editor' },
    });

    console.log(`✅ Editor deleted: ID ${id}`);

    res.json({
      success: true,
      message: 'Editor deleted successfully',
    });
  })
);

/**
 * PUT /api/editor/editors/:id/suspend
 * Suspend/unsuspend an editor (super admin only)
 */
router.put(
  '/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;
    const { suspend } = req.body;

    // 🔒 API-M3: only editor accounts may be suspended here.
    const updatedEditor = await prisma.users.update({
      where: { id: parseInt(id), role: 'editor' },
      data: { is_active: !suspend },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_active: true,
      },
    });

    console.log(`✅ Editor ${suspend ? 'suspended' : 'unsuspended'}: ${updatedEditor.email}`);

    res.json({
      success: true,
      message: `Editor ${suspend ? 'suspended' : 'activated'} successfully`,
      data: updatedEditor,
    });
  })
);

/**
 * PUT /api/editor/editors/:id/reset-2fa
 * Reset (disable) an editor's two-factor authentication — recovery for a lost
 * authenticator/backup codes (super admin only). The editor can re-enable it
 * themselves afterward.
 */
router.put(
  '/:id/reset-2fa',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;

    // 🔒 API-M3: only editor accounts' 2FA may be reset here.
    const updatedEditor = await prisma.users.update({
      where: { id: parseInt(id), role: 'editor' },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: Prisma.DbNull,
      },
      select: { id: true, full_name: true, email: true, two_factor_enabled: true },
    });

    console.log(`✅ Editor 2FA reset: ${updatedEditor.email}`);

    res.json({
      success: true,
      message: 'Two-factor authentication reset successfully',
      data: updatedEditor,
    });
  })
);

export default router;
