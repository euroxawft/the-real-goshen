'use client';

import Link from 'next/link';
import { Check, Clock3, Copy, MessageCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { SiteChrome } from '@/components/public/site-chrome';
import { useChromeData } from '@/lib/chrome-client';
import { useCart } from '@/lib/cart/cart-store';
import { useCartPricing } from '@/lib/cart/use-cart-pricing';
import { createInterest } from '@/lib/api/interests';
import { ApiError } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';

type SuccessData = { reference: string; whatsappNumber: string; hasPreorder: boolean; longestLeadTimeText: string | null };

export default function SubmitPage() {
  const { lines, clear, hydrated } = useCart();
  const pricing = useCartPricing();
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chrome = useChromeData();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const website = formData.get('website') as string;
    if (website) return;
    setSubmitting(true);
    try {
      const result = await createInterest({
        customerName: formData.get('name') as string,
        customerEmail: formData.get('email') as string,
        customerPhone: formData.get('phone') as string,
        note: (formData.get('note') as string) || undefined,
        website: website || undefined,
        items: lines,
      });
      clear();
      setSuccess(result);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) setError('Too many attempts, please try again later.');
        else setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const s = chrome.settings;
  const wc = { settings: s, categories: chrome.categories, discountBar: chrome.discountBar };

  if (sent && success) {
    const waUrl = `https://wa.me/${success.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello TrG_studio, I am following up on ${success.reference}.`)}`;
    return (
      <SiteChrome {...wc}>
        <div className="container">
          <div className="form-card success-box" style={{ maxWidth: 620, margin: '70px auto' }}>
            <div className="success-icon"><Check size={28} /></div>
            <span className="eyebrow">Interest received</span>
            <h2 style={{ margin: '10px 0' }}>We have received your interests</h2>
            <p className="helper">We will reach out shortly to confirm availability and payment.</p>
            <div className="badge preorder" style={{ margin: '20px 0', fontSize: 14 }}>
              Reference: {success.reference} <Copy size={14} />
            </div>
            {success.hasPreorder && (
              <div className="availability-card">
                <strong><Clock3 size={16} style={{ display: 'inline', marginRight: 6 }} /> Preorder items {success.longestLeadTimeText ? `usually arrive ${success.longestLeadTimeText}` : 'usually arrive in about 4 to 8 weeks'} after confirmation</strong>
                <span className="helper">We will keep you updated until they arrive.</span>
              </div>
            )}
            <a href={waUrl} className="button whatsapp-button" style={{ width: '100%', marginTop: 16 }}>
              <MessageCircle size={17} /> Chat on WhatsApp
            </a>
            <Link href="/products" className="button" style={{ marginTop: 10, color: 'var(--muted)' }}>Continue browsing</Link>
          </div>
        </div>
      </SiteChrome>
    );
  }

  if (!hydrated) return <SiteChrome {...wc}><div className="container" style={{ paddingTop: 120 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div></SiteChrome>;

  if (!lines.length) {
    return (
      <SiteChrome {...wc}>
        <div className="empty-state section">
          <h2>Your picks are waiting</h2>
          <p>Add a few pieces before submitting your interests.</p>
          <Link href="/products" className="button button-dark">Browse the shop</Link>
        </div>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome {...wc}>
      <section className="page-hero"><div className="container"><span className="breadcrumb">Your picks / Submit</span><h1>Almost there</h1><p>Tell us how to reach you. No payment is taken here.</p></div></section>
      <div className="container form-layout">
        <form className="form-card" onSubmit={submit}>
          <h2>Share your details</h2>
          <p className="form-intro">We will confirm availability and the next steps with you directly.</p>
          {error && <div className="availability-card" style={{ color: 'var(--danger)', marginTop: 0 }}>{error}</div>}
          <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" required /></div>
          <div className="field"><label htmlFor="phone">Phone number</label><span className="helper">WhatsApp number preferred</span><input id="phone" name="phone" type="tel" required /></div>
          <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required /></div>
          <div className="field"><label htmlFor="note">Note <span className="helper">(optional)</span></label><textarea id="note" name="note" maxLength={500} placeholder="Colour, size, delivery location..." /></div>
          <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
          <label className="helper" style={{ display: 'flex', gap: 8, marginBottom: 20 }}><input type="checkbox" required /> By submitting, you agree that we may contact you about these items.</label>
          <button className="button button-dark" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit my interests'}</button>
        </form>
        <aside className="summary-card">
          <h3>{lines.length} item{lines.length > 1 ? 's' : ''} selected</h3>
          {pricing.items.map((item) => item.available ? (
            <div key={item.productId} className="summary-row">
              <span>{item.name ?? 'Product'} × {item.quantity}</span>
              <span>{formatNaira(item.lineTotal ?? 0)}</span>
            </div>
          ) : (
            <div key={item.productId} className="summary-row" style={{ color: 'var(--danger)' }}>
              <span>{item.name ?? 'Product'} — No longer available</span>
            </div>
          ))}
          {pricing.totals.savings > 0 && (
            <div className="summary-row"><span>Savings</span><span style={{ color: 'var(--gold-text)' }}>−{formatNaira(pricing.totals.savings)}</span></div>
          )}
          <div className="summary-row total"><span>Estimated total</span><span>{formatNaira(pricing.totals.estimatedTotal)}</span></div>
          {pricing.hasPreorder && (
            <div className="availability-card">
              <strong><Clock3 size={15} style={{ display: 'inline', marginRight: 5 }} /> Preorder notice</strong>
              <span className="helper">{pricing.longestLeadTimeText ? `Longest wait: ${pricing.longestLeadTimeText}.` : ''} {pricing.preorderNote ?? ''}</span>
            </div>
          )}
        </aside>
      </div>
    </SiteChrome>
  );
}
