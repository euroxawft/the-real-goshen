'use client';

import Link from 'next/link';
import { ChevronRight, Clock3, MessageSquare, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getDashboard } from '@/lib/api/account';
import { formatNaira } from '@/lib/format';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, retry: false });

  return (
    <AdminLayout title="Dashboard" eyebrow="Here is what is happening with your shop">
      {isLoading ? (
        <div className="admin-grid"><div className="skeleton" style={{ height: 120, borderRadius: 16 }} /><div className="skeleton" style={{ height: 120, borderRadius: 16 }} /><div className="skeleton" style={{ height: 120, borderRadius: 16 }} /><div className="skeleton" style={{ height: 120, borderRadius: 16 }} /></div>
      ) : data ? (
        <>
          <div className="admin-grid">
            <div className="admin-stat"><span>Interests today</span><strong>{data.stats.interestsToday}</strong><span className="helper">{data.stats.totalInterests} all time</span></div>
            <div className="admin-stat"><span>Published products</span><strong>{data.stats.publishedProducts}</strong><span className="helper">{data.stats.totalProducts} total</span></div>
            <div className="admin-stat"><span>Messages today</span><strong>{data.stats.contactsToday}</strong><span className="helper">{data.stats.totalContacts} all time</span></div>
            <div className="admin-stat"><span>Journal stories</span><strong>{data.stats.publishedBlogs}</strong><span className="helper">{data.stats.totalBlogs} total</span></div>
            <div className="admin-stat"><span>Active discounts</span><strong>{data.stats.activeDiscounts}</strong></div>
          </div>
          <div className="admin-columns">
            <section className="admin-card">
              <div className="section-heading" style={{ marginBottom: 6 }}>
                <h2>Today's interests</h2>
                <Link href="/admin/interests" className="text-link">View all</Link>
              </div>
              {data.todayInterests.length > 0 ? (
                data.todayInterests.map((item) => (
                  <Link href={`/admin/interests/${item.id}`} className="admin-row" key={item.id}>
                    <div>
                      <strong>{item.customerName}</strong>
                      <div className="helper">{item.reference} · {formatNaira(item.totalEstimate)}</div>
                    </div>
                    <span className={`status-chip ${item.status === 'completed' ? 'green' : ''}`}>{item.status}</span>
                    <ChevronRight size={17} color="var(--muted)" />
                  </Link>
                ))
              ) : <p className="helper" style={{ padding: 20 }}>No interests today yet.</p>}
            </section>
            <section className="admin-card">
              <h2>Needs attention</h2>
              {data.needsAttention.length > 0 ? (
                data.needsAttention.slice(0, 6).map((item) => (
                  <Link href={`/admin/interests/${item.id}`} className="admin-row" key={item.id}>
                    <div>
                      <strong>{item.customerName}</strong>
                      <div className="helper">{item.reference} · {item.status}</div>
                    </div>
                    <ChevronRight size={17} color="var(--muted)" />
                  </Link>
                ))
              ) : <p className="helper" style={{ padding: 20 }}>Everything is handled.</p>}
            </section>
          </div>
          {data.activeDiscounts.length > 0 && (
            <section className="admin-card" style={{ marginTop: 24 }}>
              <h2>Active discounts</h2>
              {data.activeDiscounts.map((d: any) => (
                <div className="admin-row" key={d.id}>
                  <div><strong>{d.name}</strong><div className="helper">{d.scope === 'all' ? 'All products' : d.product?.name ?? 'Single product'}</div></div>
                  <span className="badge discount">−{d.percentage}%</span>
                  <span className={`status-chip ${d.state === 'running' ? 'green' : ''}`}>{d.state}</span>
                </div>
              ))}
            </section>
          )}
        </>
      ) : (
        <div className="empty-state"><p>Could not load dashboard data.</p></div>
      )}
    </AdminLayout>
  );
}
