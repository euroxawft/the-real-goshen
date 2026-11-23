import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles, Users } from 'lucide-react';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { getPublicSettings } from '@/server/resources/settings/settings.service';

export const revalidate = 60;

export async function generateMetadata() {
  return { title: 'About — TrG Studio', description: 'TrG_studio is a Lagos-based edit of bags, shoes, and accessories for your becoming.' };
}

export default async function AboutPage() {
  const { settings, categories, discountBar } = await getChromeData();
  const publicSettings = await getPublicSettings().catch(() => null);

  const aboutBody = publicSettings?.aboutBody || 'We believe great style should feel exciting and attainable at the same time. Our pieces are selected to help you express yourself boldly, whether you are dressing for a milestone or simply making an ordinary day feel more like yours.';
  const aboutImage = publicSettings?.aboutImageUrl ?? null;

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <section className="page-hero"><div className="container"><span className="breadcrumb">Home / About</span><h1>Style, with intention.</h1><p>TrG_studio is a Lagos-based edit of bags, shoes, and accessories for your becoming.</p></div></section>
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <span className="eyebrow">Our story</span>
          <h2 style={{ marginTop: 12 }}>A little luxury, made personal.</h2>
          {aboutImage && (
            <Image src={aboutImage} alt="TrG_studio" width={860} height={500} style={{ width: '100%', height: 'auto', borderRadius: 20, marginTop: 32, marginBottom: 32 }} unoptimized />
          )}
          <p style={{ color: 'var(--muted)', fontSize: 18, lineHeight: 1.8, maxWidth: 720, marginTop: 22 }}>{aboutBody}</p>
          <div className="steps" style={{ marginTop: 60 }}>
            <div className="step"><div className="step-icon"><Heart size={21} /></div><h3>Considered</h3><p>Every piece earns its place in the edit.</p></div>
            <div className="step"><div className="step-icon"><Sparkles size={21} /></div><h3>Confident</h3><p>Accessories should help you feel more like yourself.</p></div>
            <div className="step"><div className="step-icon"><Users size={21} /></div><h3>Personal</h3><p>Real support from a real person, whenever you need it.</p></div>
          </div>
        </div>
      </section>
      <section className="editorial-band">
        <div className="container editorial-content">
          <h2>Find the piece that feels like you.</h2>
          <Link href="/products" className="button button-gold">Shop the collection</Link>
        </div>
      </section>
    </SiteChrome>
  );
}
