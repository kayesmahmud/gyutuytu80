import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Categories an editor can file a template under. Keep in sync with the web UI.
const VALID_CATEGORIES = ['ad_rejection', 'verification_rejection', 'support', 'suspension'];
const VALID_VISIBILITY = ['global', 'private'];

// Roles allowed to edit/delete ANY template (not just their own).
const ADMIN_ROLES = ['admin', 'super_admin', 'root'];

type MacroRow = {
  id: number;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  category: string;
  visibility: string;
  usage_count: number;
  is_active: boolean;
  created_by: number;
  created_at: Date | null;
  users?: { full_name: string | null } | null;
};

/**
 * Shape a DB macro row into the camelCase API template the web app consumes.
 * `isOwner` is computed server-side so the client never has to re-derive who
 * may edit/delete a shared (global) template.
 */
function toApiTemplate(row: MacroRow, userId: number, isAdmin: boolean) {
  return {
    id: row.id,
    title: row.title,
    titleNe: row.title_ne,
    content: row.content,
    contentNe: row.content_ne,
    category: row.category,
    visibility: row.visibility,
    usageCount: row.usage_count,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdByName: row.users?.full_name || 'System',
    isOwner: row.created_by === userId || isAdmin,
    createdAt: row.created_at?.toISOString() || null,
  };
}

/**
 * GET /api/editor/templates
 * List templates visible to the current editor: every GLOBAL template plus the
 * editor's OWN private ones. Optional ?category= and ?search= filters.
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = ADMIN_ROLES.includes(req.user!.role || '');
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const rows = await prisma.support_macros.findMany({
      where: {
        is_active: true,
        // Visibility rule: global templates are shared with everyone; private
        // templates are only visible to the editor who created them.
        OR: [{ visibility: 'global' }, { created_by: userId }],
        ...(category && category !== 'all' ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { content: { contains: search, mode: 'insensitive' as const } },
                { title_ne: { contains: search } },
                { content_ne: { contains: search } },
              ],
            }
          : {}),
      },
      include: { users: { select: { full_name: true } } },
      orderBy: [{ usage_count: 'desc' }, { title: 'asc' }],
    });

    res.json({
      success: true,
      data: rows.map((r) => toApiTemplate(r as MacroRow, userId, isAdmin)),
    });
  })
);

/**
 * POST /api/editor/templates
 * Create a template. visibility 'global' shares it with all editors; 'private'
 * keeps it to the creator.
 */
router.post(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = ADMIN_ROLES.includes(req.user!.role || '');
    const { title, titleNe, content, contentNe, category, visibility } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Invalid visibility' });
    }

    const row = await prisma.support_macros.create({
      data: {
        title: title.trim(),
        title_ne: titleNe?.trim() || null,
        content: content.trim(),
        content_ne: contentNe?.trim() || null,
        category: category || 'support',
        visibility: visibility || 'private',
        created_by: userId,
      },
      include: { users: { select: { full_name: true } } },
    });

    res.status(201).json({ success: true, data: toApiTemplate(row as MacroRow, userId, isAdmin) });
  })
);

/**
 * PUT /api/editor/templates/:id
 * Edit a template. Only the creator (or an admin) may edit — a global template
 * shared by a teammate is read-only to everyone else.
 */
router.put(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = ADMIN_ROLES.includes(req.user!.role || '');
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const existing = await prisma.support_macros.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    if (existing.created_by !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only edit your own templates' });
    }

    const { title, titleNe, content, contentNe, category, visibility } = req.body;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Invalid visibility' });
    }

    const row = await prisma.support_macros.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(titleNe !== undefined ? { title_ne: titleNe?.trim() || null } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(contentNe !== undefined ? { content_ne: contentNe?.trim() || null } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        updated_at: new Date(),
      },
      include: { users: { select: { full_name: true } } },
    });

    res.json({ success: true, data: toApiTemplate(row as MacroRow, userId, isAdmin) });
  })
);

/**
 * DELETE /api/editor/templates/:id
 * Only the creator (or an admin) may delete.
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = ADMIN_ROLES.includes(req.user!.role || '');
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const existing = await prisma.support_macros.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    if (existing.created_by !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own templates' });
    }

    await prisma.support_macros.delete({ where: { id } });
    res.json({ success: true });
  })
);

/**
 * POST /api/editor/templates/:id/use
 * Increment usage_count when an editor copies/uses a template. Any visible
 * template can be counted (global or own).
 */
router.post(
  '/:id/use',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const existing = await prisma.support_macros.findUnique({
      where: { id },
      select: { visibility: true, created_by: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    // Only count templates the editor can actually see.
    if (existing.visibility !== 'global' && existing.created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const row = await prisma.support_macros.update({
      where: { id },
      data: { usage_count: { increment: 1 } },
      select: { usage_count: true },
    });

    res.json({ success: true, data: { usageCount: row.usage_count } });
  })
);

export default router;
