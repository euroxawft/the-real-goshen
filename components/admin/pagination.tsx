'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const withGaps: (number | 'gap')[] = [];
  for (const p of pages) {
    if (withGaps.length && typeof withGaps[withGaps.length - 1] === 'number' && p - (withGaps[withGaps.length - 1] as number) > 1) withGaps.push('gap');
    withGaps.push(p);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
      <button
        className="button"
        style={{ padding: '8px 12px' }}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {withGaps.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="helper">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`chip ${p === page ? 'active' : ''}`}
            style={{ minWidth: 38, justifyContent: 'center' }}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="button"
        style={{ padding: '8px 12px' }}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
