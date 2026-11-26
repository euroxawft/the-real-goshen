import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { discountEvents, discountProducts, products } from '@/server/db/schema';
import { getDiscountState } from '@/server/resources/discounts/discounts.service';
import { getPublicUrl } from '@/server/storage/r2';
import { HttpError } from '@/server/common/utils/http-error';

export async function listAdminDiscounts() {
  const events = await db.select().from(discountEvents).orderBy(desc(discountEvents.createdAt));
  const eventIds = events.map((event) => event.id);
  const links = eventIds.length ? await db.select({ discountEventId: discountProducts.discountEventId, productId: discountProducts.productId, productName: products.name })
    .from(discountProducts).leftJoin(products, eq(discountProducts.productId, products.id))
    .where(inArray(discountProducts.discountEventId, eventIds)) : [];
  return events.map((event) => {
    const legacyProduct = event.productId ? (legacyName(event, links) ?? null) : null;
    const targeted = links.filter((link) => link.discountEventId === event.id).map((link) => ({ id: link.productId, name: link.productName }));
    const single = event.productId && !targeted.length ? legacyProduct : null;
    return {
      ...event,
      state: getDiscountState(event),
      product: single ? { id: event.productId, name: single } : null,
      products: targeted,
      productCount: targeted.length,
    };
  });
}

function legacyName(event: typeof discountEvents.$inferSelect, links: { productId: string | null; productName: string | null; discountEventId: string }[]) {
  if (links.some((link) => link.discountEventId === event.id)) return null;
  return event.productId ? 'Selected product' : null;
}

export async function createDiscount(input: { name: string; scope: 'all' | 'product'; productIds?: string[]; percentage: number; startsAt: string; endsAt: string; isActive?: boolean }) {
  if (input.scope === 'product' && (!input.productIds || input.productIds.length === 0)) throw new HttpError(422, 'Product-scoped discounts need at least one product');
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (endsAt <= startsAt) throw new HttpError(422, 'End date must be after start date');
  const [created] = await db.insert(discountEvents).values({
    name: input.name,
    scope: input.scope,
    productId: null,
    percentage: input.percentage,
    startsAt,
    endsAt,
    isActive: input.isActive ?? true,
  }).returning();
  if (input.scope === 'product') {
    await db.insert(discountProducts).values(input.productIds!.map((productId) => ({ discountEventId: created.id, productId })));
  }
  return created;
}

export async function toggleDiscount(id: string) {
  const current = (await db.select().from(discountEvents).where(eq(discountEvents.id, id)).limit(1))[0];
  if (!current) return null;
  const [updated] = await db.update(discountEvents).set({ isActive: !current.isActive }).where(eq(discountEvents.id, id)).returning();
  return updated;
}

export async function deleteDiscount(id: string) {
  const [deleted] = await db.delete(discountEvents).where(eq(discountEvents.id, id)).returning();
  if (!deleted) return null;
  return { id };
}
