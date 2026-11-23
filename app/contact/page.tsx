'use client';

import { Check, MessageCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { SiteChrome } from '@/components/public/site-chrome';
import { useChromeData } from '@/lib/chrome-client';
import { submitContact } from '@/lib/api/contacts';
import { ApiError } from '@/lib/api/client';

const SUBJECTS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'order', label: 'Order enquiry' },
  { value: 'product', label: 'Product enquiry' },
  { value: 'partnership', label: 'Partnership / bulk order' },
  { value: 'complaint', label: 'Complaint' },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chrome = useChromeData();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const website = formData.get('website') as string;
    if (website) { setSent(true); return; }
    try {
      await submitContact({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: (formData.get('phone') as string) || undefined,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
        website: website || undefined,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 429 ? 'Too many attempts, please try again later.' : err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const s = chrome.settings;
  const whatsappUrl = s?.whatsappNumber ? `https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, '')}` : '#';
  const storeEmail = s?.storeEmail ?? 'hello@trgstudio.com';
  const wc = { settings: chrome.settings, categories: chrome.categories, discountBar: chrome.discountBar };

  return (
    <SiteChrome {...wc}>
      <section className="page-hero"><div className="container"><span className="breadcrumb">Home / Contact</span><h1>Get in touch</h1><p>We usually reply within 24 hours.</p></div></section>
      <div className="container form-layout">
        <div className="form-card">
          {sent ? (
            <div className="success-box">
              <div className="success-icon"><Check size={28} /></div>
              <h2>Message sent</h2>
              <p className="helper">We have emailed you a confirmation and will be in touch soon.</p>
              <button className="button button-light-outline" onClick={() => setSent(false)}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2>Start a conversation</h2>
              <p className="form-intro">Questions about a piece, a custom request, or your interest? We are happy to help.</p>
              {error && <div className="availability-card" style={{ color: 'var(--danger)', marginTop: 0 }}>{error}</div>}
              <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" required /></div>
              <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" required /></div>
              <div className="field"><label htmlFor="contact-phone">Phone <span className="helper">(optional)</span></label><input id="contact-phone" name="phone" type="tel" /></div>
              <div className="field"><label htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" name="subject">
                  {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" minLength={10} maxLength={2000} required /></div>
              <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
              <button className="button button-dark" disabled={submitting}>{submitting ? 'Sending...' : 'Send message'}</button>
            </form>
          )}
        </div>
        <aside className="info-card">
          <span className="eyebrow eyebrow-light">Come say hello</span>
          <h2>Good style is better shared.</h2>
          <p>For quick questions and updates, WhatsApp is usually the fastest way to reach us.</p>
          {s?.whatsappNumber && <a href={whatsappUrl} className="button whatsapp-button"><MessageCircle size={17} /> Chat on WhatsApp</a>}
          <div style={{ marginTop: 35 }}>
            <p><strong>Email</strong><br /><a href={`mailto:${storeEmail}`}>{storeEmail}</a></p>
            {s?.businessHours && <p><strong>Hours</strong><br />{s.businessHours}</p>}
            {s?.address && <p><strong>Based in</strong><br />{s.address}</p>}
          </div>
        </aside>
      </div>
    </SiteChrome>
  );
}
