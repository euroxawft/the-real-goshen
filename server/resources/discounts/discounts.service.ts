import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '@/server/db';
import { discountEvents, discountProducts } from '@/server/db/schema';
import { setDiscountProductMap } from '@/server/common/utils/discount';

export async function getRunningEvents(now = new Date()) {
  const events = await db.select().from(discountEvents).where(and(eq(discountEvents.isActive, true), lt(discountEvents.startsAt, now), gte(discountEvents.endsAt, now)));
  const multiEvents = events.filter((event) => event.scope === 'product');
  if (multiEvents.length) {
    const links = await db.select({ discountEventId: discountProducts.discountEventId, productId: discountProducts.productId })
      .from(discountProducts)
      .where(inArray(discountProducts.discountEventId, multiEvents.map((event) => event.id)));
    setDiscountProductMap(links);
  } else {
    setDiscountProductMap([]);
  }
  return events;
}

export function getDiscountState(event: { isActive: boolean; startsAt: Date; endsAt: Date }, now = new Date()) { if (!event.isActive) return 'disabled'; if (event.startsAt > now) return 'scheduled'; if (event.endsAt <= now) return 'ended'; return 'running'; }
