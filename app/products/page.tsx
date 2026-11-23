import { Search, SlidersHorizontal } from 'lucide-react';
import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { ProductCard } from '@/components/public/product-card';
import { listPublicProducts } from '@/server/resources/products/products.service';
import { listCategories } from '@/server/resources/categories/categories.service';

export const revalidate = 30;

type SearchParams = { q?: string; category?: string; sort?: string; availability?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { settings, categories, discountBar } = await getChromeData();
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const result = await listPublicProducts({
    q: searchParams.q,
    category: searchParams.category,
    availability: searchParams.availability === 'preorder' || searchParams.availability === 'ready_stock' ? searchParams.availability : undefined,
    sort: searchParams.sort,
    page,
    limit: 24,
  }).catch(() => ({ items: [], total: 0 }));

  const activeCategory = searchParams.category ?? '';
  const q = searchParams.q ?? '';

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <section className="page-hero">
        <div className="container">
          <span className="breadcrumb">Home / Shop</span>
          <h1>The collection</h1>
          <p>Accessories with presence, selected for real life and the moments that matter.</p>
        </div>
      </section>

      <div className="shop-toolbar">
        <div className="container toolbar-inner">
          <form className="search-box" action="/products" method="GET">
            <Search size={17} />
            <input name="q" defaultValue={q} placeholder="Search pieces" aria-label="Search pieces" />
          </form>
          <div className="filter-chips">
            <a className={`chip ${!activeCategory ? 'active' : ''}`} href={`/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(searchParams.sort ? { sort: searchParams.sort } : {}) })}`}>All pieces</a>
            {categories.map((cat) => (
              <a key={cat.id} className={`chip ${activeCategory === cat.slug ? 'active' : ''}`} href={`/products?${new URLSearchParams({ category: cat.slug, ...(q ? { q } : {}), ...(searchParams.sort ? { sort: searchParams.sort } : {}) })}`}>{cat.name}</a>
            ))}
            <a className={`chip desktop-only ${searchParams.sort === 'on_sale' ? 'active' : ''}`} href={`/products?sort=on_sale`}><SlidersHorizontal size={14} /> On sale</a>
            <a className={`chip desktop-only ${searchParams.availability === 'preorder' ? 'active' : ''}`} href={`/products?availability=preorder`}>Preorder</a>
            <a className={`chip desktop-only ${searchParams.availability === 'ready_stock' ? 'active' : ''}`} href={`/products?availability=ready_stock`}>Ready stock</a>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{result.total} pieces</span>
              <h2>Made to be noticed</h2>
            </div>
            <span className="helper">Prices are estimates · no payment on the website</span>
          </div>
          {result.items.length ? (
            <div className="products-grid">{result.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="empty-state">
              <h2>No pieces match your search</h2>
              <p>Try another word or clear your filters.</p>
              <a className="button button-dark" href="/products">Clear filters</a>
            </div>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
