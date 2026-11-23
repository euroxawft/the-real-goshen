'use client';

import { useEffect, useState } from 'react';

type Category = { id: string; name: string; slug: string; productCount?: number };
type Settings = {
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
type DiscountBar = { name: string; percentage: number; endsAt: string } | null;
type ChromeData = { settings: Settings | null; categories: Category[]; discountBar: DiscountBar };

export function useChromeData(): ChromeData {
  const [chrome, setChrome] = useState<ChromeData>({ settings: null, categories: [], discountBar: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, catsRes, discountRes] = await Promise.all([
          fetch('/api/settings/public'),
          fetch('/api/categories'),
          fetch('/api/discounts/active'),
        ]);
        const settingsBody = await settingsRes.json();
        const catsBody = await catsRes.json();
        const discountBody = await discountRes.json();
        if (cancelled) return;
        const settings = settingsBody.success ? settingsBody.data : null;
        const categories = catsBody.success ? (catsBody.data.items ?? []) : [];
        const events = discountBody.success ? (discountBody.data.events ?? []) : [];
        const storeWide = events.find((d: any) => d.scope === 'all') ?? null;
        const discountBar = storeWide
          ? { name: storeWide.name, percentage: storeWide.percentage, endsAt: storeWide.endsAt }
          : null;
        setChrome({ settings, categories, discountBar });
      } catch {
        // keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return chrome;
}
