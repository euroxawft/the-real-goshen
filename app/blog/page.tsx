import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { db } from '@/server/db';
import { blogPosts } from '@/server/db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';
import { getPublicUrl } from '@/server/storage/r2';

export const revalidate = 60;

export async function generateMetadata() {
  return { title: 'Journal — TrG Studio', description: 'Notes on style, confidence, and choosing the pieces you will reach for.' };
}

export default async function BlogPage() {
  const { settings, categories, discountBar } = await getChromeData();

  let posts: Array<{ id: string; title: string; slug: string; excerpt: string; coverUrl: string | null; publishedAt: Date | null; readMinutes: number }> = [];
  try {
    const rows = await db.select().from(blogPosts).where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, new Date()))).orderBy(desc(blogPosts.publishedAt));
    posts = rows.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverUrl: post.coverImageKey ? getPublicUrl(post.coverImageKey) : null,
      publishedAt: post.publishedAt,
      readMinutes: Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)),
    }));
  } catch { /* empty */ }

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <section className="page-hero"><div className="container"><span className="breadcrumb">Home / Journal</span><h1>The journal</h1><p>Notes on style, confidence, and choosing the pieces you will reach for.</p></div></section>
      <section className="section">
        <div className="container">
          {posts.length > 0 ? (
            <div className="category-grid">
              {posts.map((post, index) => (
                <article key={post.id} className="admin-card" style={{ minHeight: index === 0 ? 300 : 260, display: 'flex', flexDirection: 'column' }}>
                  {post.coverUrl && (
                    <Image src={post.coverUrl} alt={post.title} width={400} height={200} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} unoptimized />
                  )}
                  <span className="eyebrow">{post.readMinutes} min read</span>
                  <h2 style={{ margin: '14px 0', fontSize: index === 0 ? 38 : 30 }}>{post.title}</h2>
                  <p style={{ color: 'var(--muted)' }}>{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="text-link" style={{ marginTop: 'auto' }}>Read story <ArrowRight size={15} style={{ display: 'inline' }} /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No stories yet</h2>
              <p>Check back soon for notes on style and confidence.</p>
            </div>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
