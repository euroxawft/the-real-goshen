import { getPublicSettings } from '@/server/resources/settings/settings.service';
import { listCategories } from '@/server/resources/categories/categories.service';
import { getRunningEvents } from '@/server/resources/discounts/discounts.service';

export type ChromeCategory = { id: string; name: string; slug: string; productCount?: number };
export type ChromeSettings = {
  whatsappNumber: string;
  storeEmail: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  businessHours: string | null;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string | null;
  aboutBody: string;
  aboutImageUrl: string | null;
  announcementText: string | null;
  announcementActive: boolean;
  defaultLeadTimeWeeksMin: number;
  defaultLeadTimeWeeksMax: number;
  preorderNote: string | null;
};
export type ChromeDiscountBar = { name: string; percentage: number; endsAt: string } | null;

export async function getChromeData(): Promise<{ settings: ChromeSettings | null; categories: ChromeCategory[]; discountBar: ChromeDiscountBar }> {
  try {
    const [settings, cats, events] = await Promise.all([
      getPublicSettings().catch(() => null),
      listCategories().catch(() => []),
      getRunningEvents().catch(() => []),
    ]);
    const categories = cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c.productCount }));
    const storeWide = events.find((e) => e.scope === 'all') ?? null;
    const discountBar = storeWide
      ? { name: storeWide.name, percentage: storeWide.percentage, endsAt: storeWide.endsAt.toISOString() }
      : null;
    return { settings, categories, discountBar };
  } catch {
    return { settings: null, categories: [], discountBar: null };
  }
}
