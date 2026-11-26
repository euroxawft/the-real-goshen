import { requireAdmin } from '@/server/resources/auth/require-admin';
import { listAdminDiscounts, createDiscount } from '@/server/resources/discounts/admin-discounts.service';
import { handleError, ok } from '@/server/common/utils/api-response';
import { parseJson } from '@/server/common/utils/request';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  scope: z.enum(['all', 'product']),
  productIds: z.array(z.string().uuid()).optional(),
  percentage: z.number().int().min(1).max(90),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok({ items: await listAdminDiscounts() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await parseJson(req, schema);
    return ok(await createDiscount(body), 201);
  } catch (error) {
    return handleError(error);
  }
}
