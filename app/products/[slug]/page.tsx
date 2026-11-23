import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { ProductCard } from '@/components/public/product-card';
import { ProductGallery } from '@/components/public/product-gallery';
import { ProductActionsClient } from '@/components/public/product-actions';
import { getPublicProduct, getRelatedProducts } from '@/server/resources/products/products.service';

export const revalidate = 30;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const product = await getPublicProduct(params.slug).catch(() => null);
  if (!product) return { title: 'Product not found' };
  return { title: `${product.name} — TrG Studio`, description: product.description };
}

export default async function ProductPage({ params }: Props) {
  const { settings, categories, discountBar } = await getChromeData();
  const product = await getPublicProduct(params.slug).catch(() => null);
  if (!product) notFound();

  const related = await getRelatedProducts(params.slug).catch(() => ({ items: [] }));
  const whatsapp = settings?.whatsappNumber ?? '';
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello TrG_studio, I am interested in the ${product.name}.`)}` : '/contact';

  const images = product.images ?? [];
  const hasMultiple = images.length > 1;
  const hasSingle = images.length === 1;
  const hasNone = images.length === 0;
  const isPreorder = product.availability === 'preorder';
  const discount = product.effectiveDiscount;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images.slice(0, 5),
    offers: { '@type': 'Offer', price: product.price, priceCurrency: 'NGN', availability: isPreorder ? 'PreOrder' : 'InStock' },
  };

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <div className="detail-layout">
          <div>
            <Link href="/products" className="text-link"><ArrowLeft size={15} style={{ display: 'inline', marginRight: 4 }} /> Back to shop</Link>
            {hasNone && <div className="product-art-placeholder" style={{ borderRadius: 20, marginTop: 16, aspectRatio: '4/5' }}><span>TrG</span></div>}
            {hasSingle && (
              <Image src={images[0]} alt={product.name} width={600} height={750} className="detail-art" style={{ borderRadius: 20, marginTop: 16, width: '100%', height: 'auto' }} unoptimized />
            )}
            {hasMultiple && (
              <ProductGallery images={images} name={product.name} />
            )}
          </div>
          <div className="detail-copy">
            <span className="eyebrow">{product.category?.name ?? 'Accessories'}</span>
            <h1>{product.name}</h1>
            <div className="detail-price">
              <strong>{formatNaira(product.price)}</strong>
              {discount && <><del>{formatNaira(discount.originalPrice)}</del><span className="badge discount">&minus;{discount.percentage}%</span></>}
            </div>
            {isPreorder ? (
              <div className="availability-card">
                <strong><Clock3 size={16} style={{ display: 'inline', marginRight: 6 }} /> Preorder · arrives in about {product.leadTime?.text}</strong>
                <span className="helper">{settings?.preorderNote ?? 'We confirm availability, payment, and delivery with you directly.'}</span>
              </div>
            ) : (
              <div className="availability-card">
                <strong>{product.stockStatus === 'limited' ? 'Limited stock' : 'In stock'}</strong>
                <span className="helper">Ready stock in Lagos. Send your interests and we will confirm details.</span>
              </div>
            )}
            <p className="detail-description">{product.description}</p>
            <ProductActionsClient productId={product.id} name={product.name} whatsappUrl={whatsappUrl} />
            <div className="trust-row">
              <span><ShieldCheck size={15} /> Direct support</span>
              <span><Sparkles size={15} /> Curated pieces</span>
              <span><Clock3 size={15} /> Updates until it arrives</span>
            </div>
          </div>
        </div>
      </div>
      {related.items.length > 0 && (
        <section className="section section-soft">
          <div className="container">
            <div className="section-heading"><div><span className="eyebrow">Keep browsing</span><h2>You may also like</h2></div></div>
            <div className="product-rail">{related.items.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </div>
        </section>
      )}
    </SiteChrome>
  );
}

function formatNaira(value: number): string { return `\u20a6${value.toLocaleString('en-NG')}`; }
