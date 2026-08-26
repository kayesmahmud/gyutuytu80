import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();

interface LocationWithCount {
  id: number;
  name: string;
  name_ne: string | null;
  slug: string | null;
  type: string | null;
  parent_id: number | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  ad_count: number;
}

/**
 * GET /api/locations
 * Get all locations with optional parent_id or type filter
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { parent_id, type } = req.query;

    let locations: LocationWithCount[];

    if (type !== undefined && parent_id !== undefined) {
      // Filter by BOTH type and parent_id
      const queryType = type as string;
      const queryParentId = parseInt(parent_id as string);

      locations = await prisma.$queryRaw<LocationWithCount[]>`
        SELECT l.*, COUNT(a.id)::int as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        WHERE l.type = ${queryType} AND l.parent_id = ${queryParentId}
        GROUP BY l.id
        ORDER BY l.name ASC
      `;
      console.log(`✅ Found ${locations.length} locations (type: ${queryType}, parent_id: ${queryParentId})`);
    } else if (type !== undefined) {
      // Filter by location type only
      locations = await prisma.$queryRaw<LocationWithCount[]>`
        SELECT l.*, COUNT(a.id)::int as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        WHERE l.type = ${type as string}
        GROUP BY l.id
        ORDER BY l.name ASC
      `;
      console.log(`✅ Found ${locations.length} locations (type: ${type})`);
    } else if (parent_id !== undefined) {
      if (parent_id === '' || parent_id === 'null') {
        // Get top-level locations (provinces)
        locations = await prisma.$queryRaw<LocationWithCount[]>`
          SELECT l.*, COUNT(a.id)::int as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id IS NULL
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
      } else {
        // Get children of specific parent
        locations = await prisma.$queryRaw<LocationWithCount[]>`
          SELECT l.*, COUNT(a.id)::int as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id = ${parseInt(parent_id as string)}
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
      }
      console.log(`✅ Found ${locations.length} locations (parent_id: ${parent_id || 'NULL'})`);
    } else {
      // Fetch all locations — capped at 1000 to prevent unbounded responses.
      // Use /api/locations/hierarchy for the full nested tree.
      locations = await prisma.$queryRaw<LocationWithCount[]>`
        SELECT l.*, COUNT(a.id)::int as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        GROUP BY l.id
        ORDER BY l.name ASC
        LIMIT 1000
      `;
    }

    // Location data is static — cache aggressively
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.json({
      success: true,
      data: locations,
    });
  })
);

/**
 * GET /api/locations/hierarchy
 * Get complete location hierarchy — single recursive CTE query (replaces ~7000 N+1 queries)
 */
router.get(
  '/hierarchy',
  catchAsync(async (_req: Request, res: Response) => {
    // One query fetches all nodes; the app reassembles the tree in memory with a Map
    type LocationRow = {
      id: number; name: string; name_ne: string | null; slug: string;
      type: string; parent_id: number | null;
    };

    const rows = await prisma.$queryRaw<LocationRow[]>`
      SELECT id, name, name_ne, slug, type, parent_id
      FROM locations
      ORDER BY name ASC
    `;

    type LocationNode = LocationRow & {
      districts?: unknown[]; municipalities?: unknown[]; areas?: unknown[];
    };
    const MUNICIPALITY_TYPES = ['municipality', 'sub-metropolitan', 'metropolitan'];

    // Pass 1: create every node with its (empty) child container up front.
    // Rows arrive name-sorted (not parent-before-child), so a child can be processed
    // before its parent. Initialising all containers here makes linking order-independent.
    const nodeMap = new Map<number, LocationNode>();
    for (const row of rows) {
      const node: LocationNode = { ...row };
      if (row.type === 'province') node.districts = [];
      else if (row.type === 'district') node.municipalities = [];
      else if (MUNICIPALITY_TYPES.includes(row.type)) node.areas = [];
      nodeMap.set(row.id, node);
    }

    // Pass 2: attach each node to its parent — every container is guaranteed to exist now.
    const provinces: unknown[] = [];
    for (const node of nodeMap.values()) {
      if (node.type === 'province') {
        provinces.push(node);
        continue;
      }
      const parent = node.parent_id ? nodeMap.get(node.parent_id) : undefined;
      if (!parent) continue;
      if (node.type === 'district') parent.districts?.push(node);
      else if (MUNICIPALITY_TYPES.includes(node.type)) parent.municipalities?.push(node);
      else if (node.type === 'area') parent.areas?.push(node);
    }

    const stats = {
      provinces: provinces.length,
      districts: rows.filter(r => r.type === 'district').length,
      municipalities: rows.filter(r => ['municipality', 'sub-metropolitan', 'metropolitan'].includes(r.type)).length,
    };

    logger.info('Location hierarchy fetched', stats);

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.json({ success: true, data: provinces, stats });
  })
);

/**
 * Location search that carries each result's ancestors. Picking "Thamel" has to
 * fill in Kathmandu Metropolitan City → Kathmandu → Bagmati, and the web picker
 * loads its tree lazily so it cannot resolve the chain itself. Three joins cover
 * the deepest chain we store (area → municipality → district → province).
 *
 * `hierarchy` runs root → leaf, the order clients reverse to render
 * "Thamel, Kathmandu Metropolitan City, Kathmandu, Bagmati".
 */
async function searchLocationsWithAncestors(
  searchTerm: string,
  limit: number,
  tierFirst: boolean
) {
  // Built here rather than at module scope: test files that mock
  // @thulobazaar/database don't export `Prisma`, and evaluating this on import
  // would crash the whole route module before a single test ran.
  const orderBy = tierFirst
    ? Prisma.sql`
        CASE l.type
          WHEN 'province' THEN 1
          WHEN 'district' THEN 2
          WHEN 'municipality' THEN 3
          WHEN 'area' THEN 4
          ELSE 5
        END,
        l.name ASC
      `
    : Prisma.sql`l.name ASC`;

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT l.id, l.name, l.name_ne, l.slug, l.type, l.parent_id,
           p.id   AS p_id,   p.name   AS p_name,   p.type   AS p_type,
           gp.id  AS gp_id,  gp.name  AS gp_name,  gp.type  AS gp_type,
           ggp.id AS ggp_id, ggp.name AS ggp_name, ggp.type AS ggp_type
    FROM locations l
    LEFT JOIN locations p   ON p.id   = l.parent_id
    LEFT JOIN locations gp  ON gp.id  = p.parent_id
    LEFT JOIN locations ggp ON ggp.id = gp.parent_id
    WHERE l.name ILIKE ${searchTerm}
    ORDER BY ${orderBy}
    LIMIT ${limit}
  `;

  return rows.map((row) => {
    const ancestors = [
      { id: row.ggp_id, name: row.ggp_name, type: row.ggp_type },
      { id: row.gp_id, name: row.gp_name, type: row.gp_type },
      { id: row.p_id, name: row.p_name, type: row.p_type },
    ].filter((a) => a.id !== null && a.id !== undefined);

    return {
      id: row.id,
      name: row.name,
      name_ne: row.name_ne,
      slug: row.slug,
      type: row.type,
      parent_id: row.parent_id,
      hierarchy: [...ancestors, { id: row.id, name: row.name, type: row.type }],
    };
  });
}

/**
 * GET /api/locations/search
 * Search areas/places with autocomplete
 */
router.get(
  '/search',
  catchAsync(async (req: Request, res: Response) => {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${(q as string).trim()}%`;
    const limitNum = parseInt(limit as string);

    const results = await searchLocationsWithAncestors(searchTerm, limitNum, false);

    console.log(`🔍 Area search for "${q}": Found ${results.length} results`);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/locations/search-all
 * Search ALL location levels
 */
router.get(
  '/search-all',
  catchAsync(async (req: Request, res: Response) => {
    const { q, limit = '15' } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${(q as string).trim()}%`;
    const limitNum = parseInt(limit as string);

    const results = await searchLocationsWithAncestors(searchTerm, limitNum, true);

    console.log(`🔍 All-location search for "${q}": Found ${results.length} results`);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/locations/slug/:slug
 * Get location by slug
 */
router.get(
  '/slug/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const location = await prisma.locations.findFirst({
      where: { slug },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      data: location,
    });
  })
);

/**
 * GET /api/locations/:id
 * Get single location by ID
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    let location;
    if (!isNaN(Number(id))) {
      location = await prisma.locations.findUnique({
        where: { id: parseInt(id) },
      });
    } else {
      location = await prisma.locations.findFirst({
        where: { slug: id as string },
      });
    }

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      data: location,
    });
  })
);

/**
 * POST /api/locations
 * Create location (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { name, name_ne, latitude, longitude, type, parent_id } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const location = await prisma.locations.create({
      data: {
        name,
        name_ne: name_ne || null,
        slug,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        type: type || null,
        parent_id: parent_id || null,
      },
    });

    console.log(`✅ Created location: ${location.name}`);

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  })
);

/**
 * PUT /api/locations/:id
 * Update location (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, name_ne, latitude, longitude } = req.body;

    const existingLocation = await prisma.locations.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLocation) {
      throw new NotFoundError('Location not found');
    }

    let slug = existingLocation.slug;
    if (name && name !== existingLocation.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const location = await prisma.locations.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingLocation.name,
        name_ne: name_ne !== undefined ? name_ne : existingLocation.name_ne,
        slug,
        latitude: latitude !== undefined ? parseFloat(latitude) : existingLocation.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : existingLocation.longitude,
      },
    });

    console.log(`✅ Updated location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  })
);

/**
 * DELETE /api/locations/:id
 * Delete location (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const location = await prisma.locations.findUnique({
      where: { id: parseInt(id) },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    await prisma.locations.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ Deleted location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  })
);

export default router;
