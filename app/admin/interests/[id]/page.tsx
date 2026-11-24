'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getAdminInterest, updateInterestStatus, sendReminder, resendConfirmation } from '@/lib/api/interests';
import { formatNaira } from '@/lib/format';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { useState } from 'react';

const STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'] as const;

export default function InterestDetail() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [reminderMsg, setReminderMsg] = useState('');

  const { data: interest, isLoading } = useQuery({
    queryKey: ['admin-interest', id],
    queryFn: () => getAdminInterest(id),
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateInterestStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-interest', id] }); queryClient.invalidateQueries({ queryKey: ['admin-interests'] }); toast.success('Status updated'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update'),
  });

  const remindMutation = useMutation({
    mutationFn: () => sendReminder(id, reminderMsg || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-interest', id] }); toast.success('Reminder sent'); setReminderMsg(''); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to send reminder'),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendConfirmation(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-interest', id] }); toast.success('Confirmation resent'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to resend'),
  });

  if (isLoading) return <AdminLayout title="Loading..." eyebrow="Customer interest"><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></AdminLayout>;
  if (!interest) return <AdminLayout title="Not found" eyebrow="Customer interest"><div className="empty-state"><h2>Interest not found</h2><Link href="/admin/interests" className="button button-dark">Back to interests</Link></div></AdminLayout>;

  return (
    <AdminLayout title={interest.reference} eyebrow="Customer interest">
      <div className="admin-columns">
        <section className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <span className={`status-chip ${interest.status === 'completed' ? 'green' : ''}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              Status: {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
            </span>
            <select value={interest.status} onChange={(e) => statusMutation.mutate(e.target.value)} aria-label="Change status">
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <h2 style={{ marginTop: 18 }}>{interest.customerName}</h2>
          <p className="helper">{interest.customerPhone} · {interest.customerEmail}</p>
          {interest.note && <div className="availability-card"><strong>Customer note</strong><span className="helper">{interest.note}</span></div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {interest.status !== 'completed' && (
              <button className="button button-dark" onClick={() => statusMutation.mutate('completed')}>Mark as done</button>
            )}
            <button className="button" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>Resend confirmation</button>
            <a href={`https://wa.me/${interest.customerPhone.replace(/[^0-9]/g, '')}`} className="button whatsapp-button">WhatsApp</a>
          </div>
          <div style={{ marginTop: 24 }}>
            <label className="helper">Send a reminder</label>
            <textarea value={reminderMsg} onChange={(e) => setReminderMsg(e.target.value)} placeholder="Optional message..." style={{ width: '100%', marginTop: 8, marginBottom: 8 }} />
            <button className="button button-dark" onClick={() => remindMutation.mutate()} disabled={remindMutation.isPending}>Send reminder</button>
            <p className="helper" style={{ marginTop: 8 }}>Last reminded: {interest.lastRemindedAt ? new Date(interest.lastRemindedAt).toLocaleString() : 'Never'} · {interest.reminderCount} sent</p>
          </div>
        </section>
        <section className="admin-card">
          <h2>Selected pieces</h2>
          {interest.items.map((item) => (
            <div className="admin-row" key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <div className="helper">
                  {item.availability === 'preorder' ? 'Preorder' : 'Ready stock'} · Qty {item.quantity}
                  {item.leadTimeWeeksMin ? ` · ${item.leadTimeWeeksMin}-${item.leadTimeWeeksMax} weeks` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{formatNaira(item.unitPrice * item.quantity)}</strong>
                {item.discountPercent > 0 && <del className="helper" style={{ display: 'block', fontSize: 12 }}>{formatNaira(item.originalPrice * item.quantity)}</del>}
              </div>
            </div>
          ))}
          <div className="summary-row total"><span>Estimated total</span><strong>{formatNaira(interest.totalEstimate)}</strong></div>
          <p className="helper">Prices are the ones the customer saw when they submitted.</p>
          {interest.reminders.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Reminder history</h3>
              {interest.reminders.map((r) => (
                <div key={r.id} className="helper" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  {new Date(r.sentAt).toLocaleString()} · {r.success ? 'Sent' : 'Failed'}{r.message ? ` · ${r.message}` : ''}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Link href="/admin/interests" className="text-link" style={{ display: 'block', marginTop: 20 }}>&larr; Back to interests</Link>
    </AdminLayout>
  );
}
