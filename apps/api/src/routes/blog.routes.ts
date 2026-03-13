import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/blog/posts
 * List published blog posts with pagination and filters
 */
router.get(
  '/posts',
  catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;
    const author = req.query.author as string | undefined;
    const search = req.query.search as string | undefined;
    const featured = req.query.featured === 'true';

    const where: any = {
      status: 'published',
      published_at: { not: null },
    };

    if (category) {
      const blogCat = await prisma.blog_categories.findUnique({ where: { slug: category } });
      if (blogCat) where.category_id = blogCat.id;
    }

    if (author) {
      const blogAuthor = await prisma.blog_authors.findUnique({ where: { slug: author } });
      if (blogAuthor) where.author_id = blogAuthor.id;
    }

    if (tag) {
      const blogTag = await prisma.blog_tags.findUnique({ where: { slug: tag } });
      if (blogTag) {
        where.blog_post_tags = { some: { tag_id: blogTag.id } };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { title_ne: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (featured) {
      where.is_featured = true;
    }

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        select: {
          id: true,
          title: true,
          title_ne: true,
          slug: true,
          excerpt: true,
          excerpt_ne: true,
          featured_image: true,
          featured_image_alt: true,
          featured_image_alt_ne: true,
          reading_time_min: true,
          published_at: true,
          blog_authors: {
            select: { id: true, name: true, name_ne: true, slug: true, avatar: true, credentials: true, credentials_ne: true },
          },
          blog_categories: {
            select: { id: true, name: true, name_ne: true, slug: true },
          },
        },
        orderBy: { published_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blog_posts.count({ where }),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/blog/posts/:slug
 * Get single blog post by slug, increment view count
 */
router.get(
  '/posts/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const post = await prisma.blog_posts.findUnique({
      where: { slug },
      include: {
        blog_authors: true,
        blog_categories: true,
        blog_post_tags: {
          include: { blog_tags: true },
        },
      },
    });

    if (!post || post.status !== 'published') {
      throw new NotFoundError('Blog post not found');
    }

    // Increment view count (fire-and-forget)
    prisma.blog_posts.update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } },
    }).catch(() => {});

    // Get related posts (same category, exclude current)
    const relatedPosts = await prisma.blog_posts.findMany({
      where: {
        status: 'published',
        category_id: post.category_id,
        id: { not: post.id },
      },
      select: {
        id: true,
        title: true,
        title_ne: true,
        slug: true,
        excerpt: true,
        excerpt_ne: true,
        featured_image: true,
        reading_time_min: true,
        published_at: true,
        blog_authors: {
          select: { name: true, name_ne: true, slug: true, avatar: true },
        },
      },
      orderBy: { published_at: 'desc' },
      take: 3,
    });

    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
    res.json({
      success: true,
      data: {
        ...post,
        tags: post.blog_post_tags.map(pt => pt.blog_tags),
        relatedPosts,
      },
    });
  })
);

/**
 * GET /api/blog/categories
 * List active blog categories with post counts
 */
router.get(
  '/categories',
  catchAsync(async (_req: Request, res: Response) => {
    const categories = await prisma.blog_categories.findMany({
      where: { is_active: true },
      include: {
        _count: { select: { blog_posts: { where: { status: 'published' } } } },
      },
      orderBy: { display_order: 'asc' },
    });

    const data = categories.map(cat => ({
      ...cat,
      postCount: cat._count.blog_posts,
      _count: undefined,
    }));

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.json({ success: true, data });
  })
);

/**
 * GET /api/blog/tags
 * List all tags with post counts
 */
router.get(
  '/tags',
  catchAsync(async (_req: Request, res: Response) => {
    const tags = await prisma.blog_tags.findMany({
      include: {
        _count: { select: { blog_post_tags: true } },
      },
      orderBy: { name: 'asc' },
    });

    const data = tags.map(tag => ({
      ...tag,
      postCount: tag._count.blog_post_tags,
      _count: undefined,
    }));

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.json({ success: true, data });
  })
);

/**
 * GET /api/blog/authors
 * List active blog authors
 */
router.get(
  '/authors',
  catchAsync(async (_req: Request, res: Response) => {
    const authors = await prisma.blog_authors.findMany({
      where: { is_active: true },
      include: {
        _count: { select: { blog_posts: { where: { status: 'published' } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = authors.map(a => ({
      ...a,
      postCount: a._count.blog_posts,
      _count: undefined,
    }));

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    res.json({ success: true, data });
  })
);

/**
 * GET /api/blog/authors/:slug
 * Get author profile with their posts
 */
router.get(
  '/authors/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 12;

    const author = await prisma.blog_authors.findUnique({
      where: { slug },
    });

    if (!author || !author.is_active) {
      throw new NotFoundError('Author not found');
    }

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where: { author_id: author.id, status: 'published' },
        select: {
          id: true,
          title: true,
          title_ne: true,
          slug: true,
          excerpt: true,
          excerpt_ne: true,
          featured_image: true,
          reading_time_min: true,
          published_at: true,
          blog_categories: {
            select: { id: true, name: true, name_ne: true, slug: true },
          },
        },
        orderBy: { published_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blog_posts.count({ where: { author_id: author.id, status: 'published' } }),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
    res.json({
      success: true,
      data: { author, posts },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

export default router;
