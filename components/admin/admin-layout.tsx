'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, CircleHelp, LayoutDashboard, LogOut, Menu, MessageSquare, Newspaper, Package, Settings, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '@/lib/api/auth';
import { getCounts } from '@/lib/api/account';
import { toast } from 'sonner';

const nav = [
  ['Dashboard', '/admin', LayoutDashboard],
  ['Products', '/admin/products', Package],
  ['Customer interests', '/admin/interests', ShoppingBag],
  ['Messages', '/admin/contacts', MessageSquare],
  ['Discounts', '/admin/discounts', Sparkles],
  ['FAQs', '/admin/faqs', CircleHelp],
  ['Journal', '/admin/blog', Newspaper],
  ['Settings', '/admin/settings', Settings],
] as const;

export function AdminLayout({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe, retry: false });
  const { data: counts } = useQuery({ queryKey: ['counts'], queryFn: getCounts, refetchInterval: 60000, retry: false });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.push('/admin/login');
    },
  });

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  const totalBadge = (counts?.interestsToday ?? 0) + (counts?.contactsNew ?? 0);

  const sidebar = (
    <aside className="admin-sidebar">
      <Link href="/admin" className="brand-mark" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Image src="/logo-mark.png" alt="TrG_studio" width={40} height={40} priority />
        <div style={{ lineHeight: 1.3 }}>
          <span className="brand-name" style={{ display: 'block', fontSize: 16, color: '#fff' }}>TrG_studio</span>
          <span style={{ fontSize: 11, color: 'var(--gold-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</span>
        </div>
      </Link>
      <nav>
        {nav.map(([label, href, Icon]) => (
          <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
            <Icon size={17} /> {label}
            {label === 'Customer interests' && counts?.pendingInterests ? <span className="nav-badge">{counts.pendingInterests}</span> : null}
            {label === 'Messages' && counts?.contactsNew ? <span className="nav-badge">{counts.contactsNew}</span> : null}
          </Link>
        ))}
      </nav>
      <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        <span className="helper" style={{ color: 'var(--muted-dark)' }}>Signed in as</span>
        <p style={{ margin: '5px 0 14px', color: 'var(--gold-light)', fontSize: 13 }}>{me?.name ?? 'Store owner'}</p>
        <button onClick={() => logoutMutation.mutate()} className="helper" style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell">
      {sidebar}
      <main className="admin-main">
        <div className="admin-top">
          <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <Link href="/" className="button button-dark desktop-only">View website</Link>
        </div>
        {children}
      </main>
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer admin-mobile-drawer" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--ink)' }}>
            <div className="drawer-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Image src="/trg-logo-600.jpg" alt="TrG_studio" width={88} height={88} />
              <button className="icon-button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <nav className="drawer-nav">
              {nav.map(([label, href, Icon]) => (
                <Link key={href} href={href} className={`drawer-link ${isActive(href) ? 'active' : ''}`}>
                  <Icon size={18} /> {label}
                </Link>
              ))}
              <button onClick={() => logoutMutation.mutate()} className="drawer-link" style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                <LogOut size={18} /> Sign out
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export { nav };
