/**
 * Moderation policy library — human-readable .md files the AI follows.
 *
 *   apps/api/policies/core.md               universal rules (the system prompt)
 *   apps/api/policies/categories/<slug>.md  per-parent-category guidance
 *
 * The files are plain markdown so the owner can read and edit the AI's rules
 * directly; they ship with the image (Dockerfile copies apps/api/policies).
 * Only the ad's own category file rides along on a moderation call, keeping
 * prompts small and per-category byte-stable (DeepSeek context caching).
 *
 * Fail-open everywhere: a missing/unreadable file means "no extra guidance",
 * never an error — core.md missing falls back to the built-in prompt.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@thulobazaar/database';

// src/lib/ai (dev) and dist/lib/ai (prod) are both 3 levels below apps/api
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const POLICIES_DIR = path.join(PACKAGE_ROOT, 'policies');

const CACHE_TTL_MS = 5 * 60 * 1000;
// Guardrail: a runaway file must not blow up every prompt
const MAX_POLICY_CHARS = 6000;

const fileCache = new Map<string, { content: string | null; at: number }>();

async function readPolicyFile(relPath: string): Promise<string | null> {
  const cached = fileCache.get(relPath);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.content;
  let content: string | null = null;
  try {
    const raw = await readFile(path.join(POLICIES_DIR, relPath), 'utf8');
    const trimmed = raw.trim();
    content = trimmed ? trimmed.slice(0, MAX_POLICY_CHARS) : null;
  } catch {
    content = null;
  }
  fileCache.set(relPath, { content, at: Date.now() });
  return content;
}

/** core.md, or null when absent (caller falls back to the built-in prompt). */
export function getCorePolicy(): Promise<string | null> {
  return readPolicyFile('core.md');
}

/** support.md — knowledge base for the AI support assistant, or null. */
export function getSupportPolicy(): Promise<string | null> {
  return readPolicyFile('support.md');
}

/** categories/<slug>.md for a PARENT category slug, or null. */
export function getCategoryPolicy(slug: string | null): Promise<string | null> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return Promise.resolve(null);
  return readPolicyFile(path.join('categories', `${slug}.md`));
}

/**
 * Resolve an ad's category_id (leaf or parent) to its PARENT category slug.
 * Any failure returns null — moderation then simply runs without category
 * guidance.
 */
export async function resolveParentCategorySlug(categoryId: number | null): Promise<string | null> {
  if (!categoryId) return null;
  try {
    const cat = await prisma.categories.findUnique({
      where: { id: categoryId },
      select: { slug: true, parent_id: true },
    });
    if (!cat) return null;
    if (cat.parent_id === null) return cat.slug;
    const parent = await prisma.categories.findUnique({
      where: { id: cat.parent_id },
      select: { slug: true },
    });
    return parent?.slug ?? null;
  } catch {
    return null;
  }
}
