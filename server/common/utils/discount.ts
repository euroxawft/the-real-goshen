import type { DiscountEvent } from '@/server/db/schema';
export type EffectiveDiscount = { percentage: number; eventName: string; endsAt: Date; originalPrice: number; finalPrice: number };

const productIdsByEvent = new Map<string, Set<string>>();

export function setDiscountProductMap(links: { discountEventId: string; productId: string }[]) {
  productIdsByEvent.clear();
  for (const link of links) {
    const set = productIdsByEvent.get(link.discountEventId) ?? new Set<string>();
    set.add(link.productId);
    productIdsByEvent.set(link.discountEventId, set);
  }
}

export function getEffectiveDiscount(productId: string, price: number, events: DiscountEvent[]): EffectiveDiscount | null {
  const matching = events.filter((event) => {
    if (event.scope === 'all') return true;
    if (event.productId === productId) return true;
    return productIdsByEvent.get(event.id)?.has(productId) ?? false;
  }).sort((a,b) => b.percentage - a.percentage || (a.scope === 'product' ? -1 : 1));
  const event = matching[0];
  if (!event) return null;
  return { percentage:event.percentage, eventName:event.name, endsAt:event.endsAt, originalPrice:price, finalPrice:Math.round(price * (100 - event.percentage) / 100) };
}
