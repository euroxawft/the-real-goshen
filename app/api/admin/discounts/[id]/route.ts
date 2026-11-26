import { requireAdmin } from '@/server/resources/auth/require-admin';
import { deleteDiscount } from '@/server/resources/discounts/admin-discounts.service';
import { handleError, ok, fail } from '@/server/common/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const result = await deleteDiscount(params.id);
    if (!result) return fail('Discount not found', 404);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
