'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { SiteChrome } from '@/components/public/site-chrome';
import { useChromeData } from '@/lib/chrome-client';
import { useCart } from '@/lib/cart/cart-store';
import { useCartPricing } from '@/lib/cart/use-cart-pricing';
import { formatNaira } from '@/lib/format';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { lines, setQuantity, remove, hydrated } = useCart();
  const pricing = useCartPricing();
  const chrome = useChromeData();

  if (!hydrated) return <SiteChrome settings={null} categories={[]} discountBar={null}><div className="container" style={{ paddingTop: 120, paddingBottom: 120 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div></SiteChrome>;

  return (
    <SiteChrome settings={chrome.settings} categories={chrome.categories} discountBar={chrome.discountBar}>
      <section className="page-hero"><div className="container"><span className="breadcrumb">Home / Your picks</span><h1>Your picks</h1><p>Review the pieces you love. Nothing is paid for on this website.</p></div></section>
      <div className="container">
        {lines.length === 0 ? (
          <div className="empty-state section">
            <ShoppingBag size={34} color="var(--gold-text)" />
            <h2>Your cart is empty</h2>
            <p>Start with a few pieces that feel like you.</p>
            <Link href="/products" className="button button-dark">Browse the shop</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-lines">
              {pricing.items.map((item) => (
                <div className="cart-line" key={item.productId}>
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.name ?? ''} width={96} height={120} style={{ borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 96, height: 120, borderRadius: 12, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={24} color="var(--muted)" /></div>
                  )}
                  <div>
                    {item.slug ? (
                      <Link href={`/products/${item.slug}`} className="line-name">{item.name ?? 'Product'}</Link>
                    ) : (
                      <span className="line-name">{item.name ?? 'Product'}</span>
                    )}
                    {!item.available ? (
                      <span className="line-meta" style={{ color: 'var(--danger)' }}>No longer available</span>
                    ) : (
                      <>
                        <span className="line-meta">
                          {item.availability === 'preorder' ? `Preorder · ${item.leadTimeText ?? ''}` : 'Ready stock'}
                          {item.discountPercent ? ` · −${item.discountPercent}%` : ''}
                        </span>
                        <div className="stepper" style={{ marginTop: 8 }}>
                          <button onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {item.available ? (
                      <>
                        <strong>{formatNaira(item.lineTotal ?? 0)}</strong>
                        {item.discountPercent ? <del className="helper" style={{ display: 'block', fontSize: 12 }}>{formatNaira((item.originalPrice ?? 0) * item.quantity)}</del> : null}
                        <button onClick={() => remove(item.productId)} className="text-link" style={{ display: 'block', marginTop: 8, border: 0, background: 'transparent', cursor: 'pointer' }}>
                          <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Remove
                        </button>
                      </>
                    ) : (
                      <button onClick={() => remove(item.productId)} className="text-link" style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
                        <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <aside className="summary-card">
              <h3>Interest summary</h3>
              {pricing.hasPreorder && (
                <div className="availability-card" style={{ marginTop: 0 }}>
                  <strong><Clock3 size={15} style={{ display: 'inline', marginRight: 5 }} /> Some items are preorders</strong>
                  <span className="helper">{pricing.longestLeadTimeText ? `Longest wait: ${pricing.longestLeadTimeText}.` : ''} {pricing.preorderNote ?? ''}</span>
                </div>
              )}
              {pricing.totals.savings > 0 && (
                <div className="summary-row"><span>Savings</span><span style={{ color: 'var(--gold-text)' }}>−{formatNaira(pricing.totals.savings)}</span></div>
              )}
              <div className="summary-row"><span>Estimated total</span><span>{formatNaira(pricing.totals.estimatedTotal)}</span></div>
              <p className="helper">Prices are estimates. We will confirm availability and payment with you directly.</p>
              <Link href="/cart/submit" className="button button-gold" style={pricing.items.some((i) => !i.available) ? { opacity: 0.5, pointerEvents: 'none' } : {}}>Submit my interests <ArrowRight size={16} /></Link>
              <Link href="/products" className="button" style={{ color: 'var(--muted)' }}>Continue browsing</Link>
            </aside>
          </div>
        )}
      </div>
    </SiteChrome>
  );
}
