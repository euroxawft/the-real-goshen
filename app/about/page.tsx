import Link from 'next/link';
import Image from 'next/image';
import { Heart, Sparkles, Users, MapPin, ShoppingBag, Clock3, Mail, MessageCircle, Handshake } from 'lucide-react';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { getPublicSettings } from '@/server/resources/settings/settings.service';

export const revalidate = 60;

export async function generateMetadata() {
  return { title: 'About — TrG Studio', description: 'TrG_studio is a Lagos-based edit of bags, shoes, and accessories for the woman becoming more of herself.' };
}

export default async function AboutPage() {
  const { settings, categories, discountBar } = await getChromeData();
  const publicSettings = await getPublicSettings().catch(() => null);

  const aboutBody = publicSettings?.aboutBody || 'We believe great style should feel exciting and attainable at the same time. Our pieces are selected to help you express yourself boldly, whether you are dressing for a milestone or simply making an ordinary day feel more like yours.';
  const aboutImage = publicSettings?.aboutImageUrl ?? null;

  const values = [
    { icon: Heart, title: 'Considered', text: 'Every piece earns its place in the edit. We do not stock hundreds of items — we curate the ones that make you feel like the best version of yourself.' },
    { icon: Sparkles, title: 'Confident', text: 'Accessories should help you feel more like yourself, not less. Our selections are for the woman who knows her taste and is not afraid to show it.' },
    { icon: Users, title: 'Personal', text: 'Real support from a real person, whenever you need it. No chatbots, no call centres — just someone who genuinely cares about helping you find the right piece.' },
  ];

  const stats = [
    { label: 'Pieces curated', value: '50+' },
    { label: 'Happy customers', value: '300+' },
    { label: 'Based in', value: 'Lagos, NG' },
    { label: 'Response time', value: '< 24h' },
  ];

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <section className="page-hero about-page-hero">
        <div className="container">
          <span className="breadcrumb">Home / About</span>
          <h1>Style, with intention.</h1>
          <p>TrG_studio is a Lagos-based edit of bags, shoes, and accessories for the woman becoming more of herself.</p>
        </div>
      </section>

      {/* Story section with image */}
      <section className="section">
        <div className="about-story-grid">
          <div className="about-story-copy">
            <span className="eyebrow">Our story</span>
            <h2 style={{ marginTop: 12 }}>A little luxury, made personal.</h2>
            <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.8, marginTop: 22 }}>{aboutBody}</p>
            <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.8, marginTop: 16 }}>
              TrG_studio began with a simple belief: the right accessory does not complete an outfit — it elevates the woman wearing it. Founded in Lagos, we started by sourcing pieces that our founder could not find anywhere else: accessories with presence, crafted with care, and priced for real life.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.8, marginTop: 16 }}>
              Today, we offer a carefully curated edit of bags, shoes, and accessories. Some are ready to ship from our Lagos studio. Others are preorder pieces, crafted after confirmation and worth the wait. Every piece is chosen with one question in mind: will this make her feel more like herself?
            </p>
          </div>
          <div className="about-story-image">
            {aboutImage ? (
              <Image src={aboutImage} alt="TrG_studio" width={520} height={640} style={{ width: '100%', height: 'auto', borderRadius: 20 }} unoptimized />
            ) : (
              <div className="about-image-placeholder">
                <Image src="/trg-logo-600.jpg" alt="TrG_studio" width={300} height={300} style={{ borderRadius: '50%' }} />
                <span className="about-image-tag">Lagos, Nigeria</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="section section-soft">
        <div className="container">
          <div className="about-stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="about-stat-item">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <span className="eyebrow" style={{ textAlign: 'center', display: 'block' }}>What we stand for</span>
          <h2 style={{ textAlign: 'center', marginTop: 12, marginBottom: 48 }}>Our values</h2>
          <div className="steps">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="step">
                  <div className="step-icon"><Icon size={21} /></div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section-soft">
        <div className="container" style={{ maxWidth: 860 }}>
          <span className="eyebrow" style={{ textAlign: 'center', display: 'block' }}>How TrG_studio works</span>
          <h2 style={{ textAlign: 'center', marginTop: 12, marginBottom: 48 }}>From browse to beautiful</h2>
          <div className="about-process">
            <div className="about-process-step">
              <div className="about-process-number">01</div>
              <div className="about-process-icon"><ShoppingBag size={20} /></div>
              <h3>Browse the collection</h3>
              <p>Explore our curated edit of bags, shoes, and accessories. Filter by category, availability, or sale status to find pieces that speak to you.</p>
            </div>
            <div className="about-process-step">
              <div className="about-process-number">02</div>
              <div className="about-process-icon"><Mail size={20} /></div>
              <h3>Submit your interests</h3>
              <p>Add the pieces you love to your cart and send us your interest. No payment needed on the website — just tell us how to reach you.</p>
            </div>
            <div className="about-process-step">
              <div className="about-process-number">03</div>
              <div className="about-process-icon"><MessageCircle size={20} /></div>
              <h3>We confirm together</h3>
              <p>We reach out via WhatsApp or email to confirm availability, payment, and delivery details. Preorder pieces are then crafted just for you.</p>
            </div>
            <div className="about-process-step">
              <div className="about-process-number">04</div>
              <div className="about-process-icon"><Handshake size={20} /></div>
              <h3>Receive your piece</h3>
              <p>Ready stock ships quickly. Preorder pieces arrive in about 4 to 8 weeks. We keep you updated every step of the way until your piece is in your hands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Location band */}
      <section className="section">
        <div className="container about-location-band">
          <div className="about-location-content">
            <span className="eyebrow">Our home</span>
            <h2 style={{ marginTop: 12 }}>Rooted in Lagos, reaching everywhere.</h2>
            <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.8, marginTop: 18, maxWidth: 500 }}>
              We are proudly based in Lagos, Nigeria — a city that pulses with style, creativity, and ambition. Our pieces reflect that energy: bold enough to be noticed, refined enough to last.
            </p>
            {settings?.address && (
              <p style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                <MapPin size={18} /> {settings.address}
              </p>
            )}
            {settings?.businessHours && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                <Clock3 size={18} /> {settings.businessHours}
              </p>
            )}
          </div>
          <div className="about-location-image">
            <div className="about-location-glow" />
            <Image src="/trg-logo-600.jpg" alt="TrG_studio Lagos" width={400} height={400} style={{ borderRadius: '50%', position: 'relative', zIndex: 1 }} />
          </div>
        </div>
      </section>

      {/* Editorial CTA */}
      <section className="editorial-band">
        <div className="container editorial-content">
          <h2>Find the piece that feels like you.</h2>
          <p>Every piece in our edit is waiting for someone to make it their own.</p>
          <Link href="/products" className="button button-gold">Shop the collection</Link>
        </div>
      </section>
    </SiteChrome>
  );
}
