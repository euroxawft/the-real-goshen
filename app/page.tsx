import Link from 'next/link';
import { ArrowRight, Clock3, Heart, MessageCircle, PackageCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { ProductCard } from '@/components/public/product-card';
import { SectionHeading } from '@/components/public/section-heading';
import { HeroSlider } from '@/components/public/hero-slider';
import { listPublicProducts } from '@/server/resources/products/products.service';
import { listCategories } from '@/server/resources/categories/categories.service';
import { getRunningEvents } from '@/server/resources/discounts/discounts.service';
import { getPublicSettings } from '@/server/resources/settings/settings.service';
import { formatNaira } from '@/lib/format';
import { db } from '@/server/db';
import { blogPosts } from '@/server/db/schema';
import { and, desc, eq, lte, isNull, or } from 'drizzle-orm';

export const revalidate = 60;

export default async function Home() {
  const { settings, categories, discountBar } = await getChromeData();
  const [featuredResult, blogRows] = await Promise.all([
    listPublicProducts({ featured: true, page: 1, limit: 8 }).catch(() => ({ items: [], total: 0 })),
    db.select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, excerpt: blogPosts.excerpt })
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date()))))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(3)
      .catch(() => []),
  ]);
  const blogResult = blogRows;

  const hasFeatured = featuredResult.items.length > 0;
  const hasCategories = categories.length > 0;
  const hasBlog = blogResult.length > 0;
  const whatsapp = settings?.whatsappNumber ?? '';
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` : '/contact';

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <HeroSlider />

      {hasFeatured && (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="Handpicked" title="Featured pieces" link={{ label: 'View all', href: '/products' }} />
            <div className="product-rail">{featuredResult.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
        </section>
      )}

      {hasCategories && (
        <section className="section section-soft">
          <div className="container">
            <SectionHeading eyebrow="Find your finish" title="Shop by category" />
            <div className="category-grid">
              {categories.slice(0, 3).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="category-tile">
                  <div><h3>{cat.name}</h3><span>&#x2197;</span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="The TrG way" title="Simple, personal, yours" />
          <div className="steps">
            <div className="step"><div className="step-icon"><Heart size={21} /></div><h3>Pick your favourites</h3><p>Browse the collection and save the pieces that feel like you.</p></div>
            <div className="step"><div className="step-icon"><MessageCircle size={21} /></div><h3>Send us your interests</h3><p>Tell us how to reach you. There is no payment on the website.</p></div>
            <div className="step"><div className="step-icon"><PackageCheck size={21} /></div><h3>We confirm together</h3><p>Preorder pieces usually arrive in about 4 to 8 weeks after confirmation.</p></div>
          </div>
        </div>
      </section>

      {discountBar && (
        <section className="editorial-band">
          <div className="container editorial-content">
            <span className="eyebrow eyebrow-light"><Clock3 size={13} style={{ display: 'inline', marginRight: 6 }} /> {discountBar.name} · {discountBar.percentage}% off</span>
            <h2>Your next favourite might be worth the wait.</h2>
            <p>We will confirm availability, payment, and delivery with you directly.</p>
            <Link href="/products?sort=on_sale" className="button button-gold">Shop the sale</Link>
          </div>
        </section>
      )}

      {hasBlog && (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="From the journal" title="Notes on finding your style" link={{ label: 'Read the journal', href: '/blog' }} />
            <div className="category-grid">
              {blogResult.map((post: any) => (
                <article key={post.id} className="admin-card" style={{ minHeight: 260, display: 'flex', flexDirection: 'column' }}>
                  <span className="eyebrow">{post.excerpt || 'Journal'}</span>
                  <h3 style={{ margin: '14px 0', fontSize: 26 }}>{post.title}</h3>
                  <Link href={`/blog/${post.slug}`} className="text-link" style={{ marginTop: 'auto' }}>Read story <ArrowRight size={15} style={{ display: 'inline' }} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-soft">
        <div className="container">
          <SectionHeading eyebrow="Why TrG_studio" title="Shopping that feels personal" />
          <div className="category-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="admin-card" style={{ minHeight: 0 }}>
              <div className="step-icon"><Sparkles size={20} /></div>
              <h3 style={{ margin: '12px 0 8px', fontSize: 20 }}>Handpicked pieces</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>Every bag, shoe, and accessory is chosen with intention — no filler, no trends that fade next month.</p>
            </div>
            <div className="admin-card" style={{ minHeight: 0 }}>
              <div className="step-icon"><Heart size={20} /></div>
              <h3 style={{ margin: '12px 0 8px', fontSize: 20 }}>No payment online</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>Browse freely, send your picks, and we confirm payment and delivery together on WhatsApp or by email.</p>
            </div>
            <div className="admin-card" style={{ minHeight: 0 }}>
              <div className="step-icon"><PackageCheck size={20} /></div>
              <h3 style={{ margin: '12px 0 8px', fontSize: 20 }}>Preorder worth the wait</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>Can&apos;t find your size or colour? We source preorder pieces for you, usually arriving in 4 to 8 weeks.</p>
            </div>
            <div className="admin-card" style={{ minHeight: 0 }}>
              <div className="step-icon"><Clock3 size={20} /></div>
              <h3 style={{ margin: '12px 0 8px', fontSize: 20 }}>Fast replies</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>We usually respond within 24 hours — real help from a real person, not a bot.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <SectionHeading eyebrow="Good to know" title="Questions, answered" link={{ label: 'See all FAQs', href: '/faq' }} />
          <div className="admin-card" style={{ minHeight: 0 }}>
            <div className="admin-row" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
              <strong>How do preorders work?</strong>
              <p className="helper" style={{ marginTop: 6 }}>Pick a preorder piece and send it with your interests. We confirm payment and delivery, then your piece usually arrives in 4 to 8 weeks.</p>
            </div>
            <div className="admin-row" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
              <strong>Do I pay on the website?</strong>
              <p className="helper" style={{ marginTop: 6 }}>No. The website is for browsing and building your wishlist. Payment is arranged directly with us when you are ready.</p>
            </div>
            <div className="admin-row" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
              <strong>Can I request a piece that is not listed?</strong>
              <p className="helper" style={{ marginTop: 6 }}>Yes. Message us with what you have in mind and we will do our best to source it for you.</p>
            </div>
          </div>
        </div>
      </section>

      {whatsapp && (
        <section className="section section-soft">
          <div className="container" style={{ textAlign: 'center', maxWidth: 600 }}>
            <span className="eyebrow">Talk to us</span>
            <h2 style={{ margin: '12px 0' }}>Questions about a piece?</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>We usually reply within 24 hours on WhatsApp.</p>
            <a href={whatsappUrl} className="button whatsapp-button"><MessageCircle size={17} /> Chat on WhatsApp</a>
          </div>
        </section>
      )}
    </SiteChrome>
  );
}
