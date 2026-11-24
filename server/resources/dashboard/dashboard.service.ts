import { count, desc, eq, gte, and, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { blogPosts, contacts, discountEvents, interests, interestItems, products } from '@/server/db/schema';
import { getRunningEvents } from '@/server/resources/discounts/discounts.service';
import { getDiscountState } from '@/server/resources/discounts/discounts.service';
import { getPublicUrl } from '@/server/storage/r2';

export async function getDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const allInterests = await db.select().from(interests).orderBy(desc(interests.createdAt));
  const todayInterests = allInterests.filter((row) => row.createdAt >= startOfToday);
  const allContacts = await db.select().from(contacts);
  const todayContacts = allContacts.filter((row) => row.createdAt >= startOfToday);
  const allProducts = await db.select().from(products);
  const publishedProducts = allProducts.filter((row) => row.isPublished);
  const allBlogs = await db.select({ id: blogPosts.id, isPublished: blogPosts.isPublished }).from(blogPosts);
  const publishedBlogs = allBlogs.filter((row) => row.isPublished).length;
  const events = await getRunningEvents();
  const activeDiscounts = (await db.select({ event: discountEvents, product: products }).from(discountEvents).leftJoin(products, eq(discountEvents.productId, products.id))).map(({ event, product }) => ({
    ...event,
    state: getDiscountState(event),
    product: product ? { id: product.id, name: product.name } : null,
  }));

  const needsAttention = allInterests.filter((row) => row.status === 'new' || row.status === 'contacted');

  const chartDays: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(day.getTime() + 86400000);
    const dayCount = allInterests.filter((row) => row.createdAt >= day && row.createdAt < next).length;
    chartDays.push({ date: day.toISOString().slice(0, 10), count: dayCount });
  }

  return {
    stats: {
      interestsToday: todayInterests.length,
      contactsToday: todayContacts.length,
      totalProducts: allProducts.length,
      publishedProducts: publishedProducts.length,
      activeDiscounts: events.length,
      totalInterests: allInterests.length,
      totalContacts: allContacts.length,
      totalBlogs: allBlogs.length,
      publishedBlogs,
    },
    todayInterests: todayInterests.map((row) => ({ id: row.id, reference: row.reference, customerName: row.customerName, status: row.status, totalEstimate: row.totalEstimate, createdAt: row.createdAt })),
    chart: chartDays,
    needsAttention: needsAttention.map((row) => ({ id: row.id, reference: row.reference, customerName: row.customerName, status: row.status, reminderCount: row.reminderCount, lastRemindedAt: row.lastRemindedAt })),
    activeDiscounts,
  };
}

export async function getCounts() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const allInterests = await db.select().from(interests);
  const interestsToday = allInterests.filter((row) => row.createdAt >= startOfToday).length;
  const allContacts = await db.select().from(contacts);
  const contactsNew = allContacts.filter((row) => row.status === 'new').length;
  const pendingInterests = allInterests.filter((row) => row.status === 'new' || row.status === 'contacted').length;
  return { interestsToday, contactsNew, pendingInterests };
}
