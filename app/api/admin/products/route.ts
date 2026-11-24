import { z } from 'zod';
import { requireAdmin } from '@/server/resources/auth/require-admin';
import { listAdminProducts, createProduct } from '@/server/resources/products/admin-products.service';
import { handleError, ok } from '@/server/common/utils/api-response';
import { parseJson, parseQuery } from '@/server/common/utils/request';
import { parsePagination, pageMeta } from '@/server/common/utils/pagination';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  availability: z.enum(['preorder', 'ready_stock']).optional(),
  published: z.enum(['true', 'false']).optional().transform((value) => value === undefined ? undefined : value === 'true'),
  featured: z.enum(['true', 'false']).optional().transform((value) => value === 'true' ? true : undefined),
  sort: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().max(5000).optional().default(''),
  price: z.number().int().min(0),
  categoryId: z.string().uuid().nullable().optional(),
  images: z.array(z.string().startsWith('products/')).max(8).optional().default([]),
  availability: z.enum(['preorder', 'ready_stock']).optional().default('preorder'),
  leadTimeWeeksMin: z.number().int().min(0).nullable().optional(),
  leadTimeWeeksMax: z.number().int().min(0).nullable().optional(),
  stockStatus: z.enum(['in_stock', 'limited', 'out_of_stock']).optional().default('in_stock'),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const query = parseQuery(req.url, querySchema);
    const { page, limit, offset } = parsePagination(query.page, query.limit, 100);
    const result = await listAdminProducts({ ...query, page, limit });
    return ok({ items: result.items, ...pageMeta(page, limit, result.total) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await parseJson(req, createSchema);
    const product = await createProduct(body);
    return ok(product, 201);
  } catch (error) {
    return handleError(error);
  }
}
