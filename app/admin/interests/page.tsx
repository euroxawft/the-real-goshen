'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { listAdminInterests } from '@/lib/api/interests';
import { formatNaira } from '@/lib/format';

const TABS = [
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
] as const;

const PAGE_SIZE = 20;

export default function InterestsPage() {
  const [tab, setTab] = useState<string>('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-interests', tab, search, page],
    queryFn: () => listAdminInterests({ tab, q: search, page: String(page), limit: String(PAGE_SIZE) }),
    retry: false,
  });

  return (
    <AdminLayout title="Customer interests" eyebrow="People who sent you their picks">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div className="filter-chips">
          {TABS.map((t) => (
            <button
              key={t.value}
              className={`chip ${tab === t.value ? 'active' : ''}`}
              onClick={() => { setTab(t.value); setPage(1); }}
            >
              {t.label} · {data?.tabCounts ? (t.value === 'today' ? data.tabCounts.today : t.value === 'past' ? data.tabCounts.past : data.tabCounts.all) : 0}
            </button>
          ))}
        </div>
        <form className="search-box" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }} style={{ maxWidth: 280 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, reference" aria-label="Search interests" />
        </form>
      </div>

      <section className="admin-card">
        {isLoading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        ) : data?.items.length ? (
          data.items.map((interest) => (
            <Link href={`/admin/interests/${interest.id}`} className="admin-row" key={interest.id}>
              <div>
                <strong>{interest.customerName}</strong>
                <div className="helper">{interest.reference} · {interest.customerPhone}</div>
              </div>
              <strong>{formatNaira(interest.totalEstimate)}</strong>
              <span className={`status-chip ${interest.status === 'completed' ? 'green' : ''}`}>{interest.status}</span>
            </Link>
          ))
        ) : (
          <div className="empty-state"><h2>No interests here yet</h2><p>When customers submit their picks, they appear here.</p></div>
        )}
      </section>

      <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </AdminLayout>
  );
}
