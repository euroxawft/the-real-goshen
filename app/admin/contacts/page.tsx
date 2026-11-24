'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { listAdminContacts } from '@/lib/api/contacts';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
] as const;

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-contacts', status, search, page],
    queryFn: () => listAdminContacts({ status: status || undefined, q: search || undefined, page: String(page), limit: String(PAGE_SIZE) }),
    retry: false,
  });

  return (
    <AdminLayout title="Messages" eyebrow="Stay close to your customers">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${status === f.value ? 'active' : ''}`}
              onClick={() => { setStatus(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form className="search-box" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }} style={{ maxWidth: 280 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" />
        </form>
      </div>

      <section className="admin-card">
        {isLoading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        ) : isError ? (
          <div className="error-state"><h2>Could not load messages</h2><p>Something went wrong while fetching. Check your connection and try again.</p><button className="retry-button" onClick={() => refetch()}>Try again</button></div>
        ) : data?.items.length ? (
          data.items.map((contact) => (
            <Link href={`/admin/contacts/${contact.id}`} className="admin-row" key={contact.id}>
              <div>
                <strong>{contact.name}</strong>
                <div className="helper">{contact.subject}</div>
              </div>
              <div style={{ flex: 1, color: 'var(--muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.message}</div>
              <span className={`status-chip ${contact.status !== 'new' ? 'green' : ''}`}>{contact.status}</span>
            </Link>
          ))
        ) : (
          <div className="empty-state"><h2>No messages yet</h2><p>When customers contact you, their messages appear here.</p></div>
        )}
      </section>

      <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </AdminLayout>
  );
}
