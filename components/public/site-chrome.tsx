'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Search, ShoppingBag, X, ChevronDown, Instagram, Facebook, Music2, MessageCircle, Mail } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-store';
import { useCountdown } from '@/hooks/use-countdown';
import { formatNaira } from '@/lib/format';
import { ApiError } from '@/lib/api/client';

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
type SearchResult = { id: string; slug: string; name: string; price: number; coverImage: string | null; effectiveDiscount: { percentage: number } | null };

export function SiteChrome({ children, settings, categories, discountBar }: { children: React.ReactNode; settings: Settings | null; categories: Category[]; discountBar: DiscountBar }) {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopExpand, setShopExpand] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const body = await res.json();
        if (body.success) setSearchResults(body.data.items?.slice(0, 6) ?? []);
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 250);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery]);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const cartBounce = hydrated && count !== prevCount.current;
  useEffect(() => { prevCount.current = count; }, [count]);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => (a.productCount ?? 0) - (b.productCount ?? 0) || a.name.localeCompare(b.name)), [categories]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      {settings?.announcementActive && settings?.announcementText && (
        <div className="announcement">{settings.announcementText}</div>
      )}
      {discountBar && <DiscountBanner name={discountBar.name} percentage={discountBar.percentage} endsAt={discountBar.endsAt} />}

      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-gold-line" />
        <div className="container header-inner">
          <div className="header-left">
            <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
            <nav className="desktop-nav" onMouseLeave={() => setMenuOpen(false)}>
              <Link
                href="/products"
                className={isActive('/products') ? 'active' : ''}
                onMouseEnter={() => setMenuOpen(true)}
                onFocus={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-controls="mega-menu"
              >Shop</Link>
              <Link href="/blog" className={isActive('/blog') ? 'active' : ''}>Journal</Link>
              <Link href="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
            </nav>
          </div>

          <Link href="/" className="logo-lockup" aria-label="TrG_studio home">
            <Image src="/logo-mark.png" alt="TrG_studio" width={scrolled ? 40 : 48} height={scrolled ? 40 : 48} priority className="logo-emblem" />
            <span className="logo-wordmark">TrG_studio</span>
          </Link>

          <div className="header-right">
            <Link href="/contact" className={`desktop-nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
            <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={19} /></button>
            <Link href="/cart" className="cart-link" aria-label={`Cart with ${count} items`}>
              <ShoppingBag size={20} />
              {hydrated && count > 0 && <span className={`cart-badge ${cartBounce ? 'cart-badge-bounce' : ''}`} role="status" aria-live="polite">{count}</span>}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div id="mega-menu" className="mega-menu" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
            <div className="container mega-grid">
              <div>
                <span className="eyebrow eyebrow-light">Categories</span>
                <div className="mega-links">
                  {sortedCategories.map((cat) => (
                    <Link key={cat.id} href={`/products?category=${cat.slug}`} onClick={() => setMenuOpen(false)}>
                      {cat.name} {cat.productCount !== undefined && <span className="mega-count">{cat.productCount}</span>}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <span className="eyebrow eyebrow-light">Shop by</span>
                <div className="mega-links">
                  <Link href="/products?sort=newest" onClick={() => setMenuOpen(false)}>New arrivals</Link>
                  <Link href="/products?sort=on_sale" onClick={() => setMenuOpen(false)}>On sale</Link>
                  <Link href="/products?availability=preorder" onClick={() => setMenuOpen(false)}>Preorder</Link>
                  <Link href="/products?availability=ready_stock" onClick={() => setMenuOpen(false)}>Ready stock</Link>
                </div>
              </div>
              <FeaturedCard onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="search-sheet-top">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pieces..."
                aria-label="Search products"
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              />
              <button className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button>
            </div>
            {searchLoading && <div className="search-status">Searching...</div>}
            {!searchLoading && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((item) => (
                  <Link key={item.id} href={`/products/${item.slug}`} onClick={() => setSearchOpen(false)} className="search-result">
                    {item.coverImage ? <img src={item.coverImage} alt={item.name} width={48} height={48} /> : <div className="search-result-placeholder" />}
                    <div><span className="search-result-name">{item.name}</span><span className="search-result-price">{formatNaira(item.price)}</span></div>
                  </Link>
                ))}
                <Link href={`/products?q=${encodeURIComponent(searchQuery)}`} onClick={() => setSearchOpen(false)} className="search-view-all">View all results</Link>
              </div>
            )}
            {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && <div className="search-status">No results found</div>}
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-top">
              <Image src="/trg-logo-600.jpg" alt="TrG_studio" width={96} height={96} />
              <button className="icon-button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <nav className="drawer-nav">
              <div className="drawer-link-row">
                <button className="drawer-link drawer-link-expand" onClick={() => setShopExpand(!shopExpand)} aria-expanded={shopExpand}>
                  Shop <ChevronDown size={20} style={{ transform: shopExpand ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {shopExpand && (
                  <div className="drawer-sublinks">
                    <Link href="/products" onClick={() => setDrawerOpen(false)}>All products</Link>
                    {sortedCategories.map((cat) => <Link key={cat.id} href={`/products?category=${cat.slug}`} onClick={() => setDrawerOpen(false)}>{cat.name}</Link>)}
                  </div>
                )}
              </div>
              <Link href="/blog" onClick={() => setDrawerOpen(false)} className="drawer-link">Journal</Link>
              <Link href="/faq" onClick={() => setDrawerOpen(false)} className="drawer-link">FAQ</Link>
              <Link href="/about" onClick={() => setDrawerOpen(false)} className="drawer-link">About</Link>
              <Link href="/contact" onClick={() => setDrawerOpen(false)} className="drawer-link">Contact</Link>
            </nav>
            <div className="drawer-bottom">
              {settings?.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} className="button whatsapp-button" style={{ width: '100%' }}>Chat on WhatsApp</a>
              )}
              <div className="drawer-socials">
                {settings?.instagramUrl && <a href={settings.instagramUrl} aria-label="Instagram"><Instagram size={20} /></a>}
                {settings?.tiktokUrl && <a href={settings.tiktokUrl} aria-label="TikTok"><Music2 size={20} /></a>}
                {settings?.facebookUrl && <a href={settings.facebookUrl} aria-label="Facebook"><Facebook size={20} /></a>}
              </div>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Image src="/trg-logo-600.jpg" alt="TrG_studio" width={160} height={160} className="footer-logo" />
            <p>Pieces that help you step into your style with confidence.</p>
            <span className="script">Style. Confidence. You.</span>
          </div>
          <div>
            <h4>Shop</h4>
            <Link href="/products">All products</Link>
            {sortedCategories.map((cat) => <Link key={cat.id} href={`/products?category=${cat.slug}`}>{cat.name}</Link>)}
          </div>
          <div>
            <h4>Help</h4>
            <Link href="/faq">Frequently asked questions</Link>
            <Link href="/contact">Contact us</Link>
            {settings?.whatsappNumber && <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}>WhatsApp</a>}
          </div>
          <div>
            <h4>Follow along</h4>
            {settings?.storeEmail && <a href={`mailto:${settings.storeEmail}`}>{settings.storeEmail}</a>}
            {settings?.instagramUrl && <a href={settings.instagramUrl}>Instagram</a>}
            {settings?.tiktokUrl && <a href={settings.tiktokUrl}>TikTok</a>}
            {settings?.facebookUrl && <a href={settings.facebookUrl}>Facebook</a>}
            {settings?.whatsappNumber && <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}>WhatsApp</a>}
            {settings?.businessHours && <p className="muted-dark">{settings.businessHours}</p>}
            <div className="footer-socials">
              {settings?.instagramUrl && <a href={settings.instagramUrl} aria-label="Instagram" className="footer-social-link"><Instagram size={18} /></a>}
              {settings?.tiktokUrl && <a href={settings.tiktokUrl} aria-label="TikTok" className="footer-social-link"><Music2 size={18} /></a>}
              {settings?.whatsappNumber && <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} aria-label="WhatsApp" className="footer-social-link"><MessageCircle size={18} /></a>}
              {settings?.facebookUrl && <a href={settings.facebookUrl} aria-label="Facebook" className="footer-social-link"><Facebook size={18} /></a>}
              {settings?.storeEmail && <a href={`mailto:${settings.storeEmail}`} aria-label="Email" className="footer-social-link"><Mail size={18} /></a>}
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>&copy; {new Date().getFullYear()} TrG_studio</span>
          <span>Style. Confidence. You.</span>
        </div>
      </footer>
    </div>
  );
}

function DiscountBanner({ name, percentage, endsAt }: { name: string; percentage: number; endsAt: string }) {
  const { hours, minutes, seconds, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  return (
    <div className="discount-bar">
      <span>{name} · {percentage}% off</span>
      <span className="discount-countdown">Ends in {hours}h {minutes}m {seconds}s</span>
    </div>
  );
}

function FeaturedCard({ onNavigate }: { onNavigate: () => void }) {
  const [featured, setFeatured] = useState<SearchResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/products?featured=true&limit=1')
      .then((r) => r.json())
      .then((body) => { if (body.success && body.data.items?.length) setFeatured(body.data.items[0]); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded || !featured) return null;
  return (
    <Link href={`/products/${featured.slug}`} onClick={onNavigate} className="mega-featured">
      {featured.coverImage && <img src={featured.coverImage} alt={featured.name} width={200} height={140} />}
      <div>
        <strong>{featured.name}</strong>
        <span className="text-link">View</span>
      </div>
    </Link>
  );
}


