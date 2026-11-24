import { z } from 'zod';
import { requireAdmin } from '@/server/resources/auth/require-admin';
import { listAdminInterests } from '@/server/resources/interests/admin-interests.service';
import { handleError, ok } from '@/server/common/utils/api-response';
import { parseQuery } from '@/server/common/utils/request';
import { parsePagination, pageMeta } from '@/server/common/utils/pagination';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  tab: z.enum(['today', 'past', 'all']).optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const query = parseQuery(req.url, querySchema);
    const { page, limit } = parsePagination(query.page, query.limit, 100);
    const result = await listAdminInterests({ ...query, page, limit });
    return ok({ items: result.items, tabCounts: result.tabCounts, ...pageMeta(page, limit, result.total) });
  } catch (error) {
    return handleError(error);
  }
}
