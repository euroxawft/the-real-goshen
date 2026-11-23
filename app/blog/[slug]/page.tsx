import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { BlogContent } from '@/components/public/blog-content';
import { db } from '@/server/db';
import { blogPosts } from '@/server/db/schema';
import { and, eq, lte, isNull, or } from 'drizzle-orm';
import { getPublicUrl } from '@/server/storage/r2';

export const revalidate = 60;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const post = (await db.select().from(blogPosts).where(and(eq(blogPosts.slug, params.slug), eq(blogPosts.isPublished, true), or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())))).limit(1))[0];
  if (!post) return { title: 'Article not found' };
  return { title: `${post.title} — TrG Studio Journal`, description: post.excerpt };
}

export default async function BlogArticle({ params }: Props) {
  const { settings, categories, discountBar } = await getChromeData();
  const post = (await db.select().from(blogPosts).where(and(eq(blogPosts.slug, params.slug), eq(blogPosts.isPublished, true), or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())))).limit(1))[0];
  if (!post) notFound();

  const coverUrl = post.coverImageKey ? getPublicUrl(post.coverImageKey) : null;

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <article>
        <section className="page-hero">
          <div className="container">
            <Link href="/blog" className="breadcrumb"><ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} /> Back to journal</Link>
            <span className="eyebrow eyebrow-light" style={{ marginTop: 30 }}>TrG_studio journal</span>
            <h1>{post.title}</h1>
          </div>
        </section>
        {coverUrl && (
          <div className="container" style={{ maxWidth: 860, marginTop: 40 }}>
            <Image src={coverUrl} alt={post.title} width={860} height={480} style={{ width: '100%', height: 'auto', borderRadius: 20 }} unoptimized />
          </div>
        )}
        <div className="container" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 90 }}>
          {post.excerpt && <p style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 32 }}>{post.excerpt}</p>}
          <BlogContent content={post.content} />
        </div>
      </article>
    </SiteChrome>
  );
}
