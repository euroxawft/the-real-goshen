import { SiteChrome } from '@/components/public/site-chrome';
import { getChromeData } from '@/lib/chrome';
import { FaqAccordion } from '@/components/public/faq-accordion';
import { db } from '@/server/db';
import { faqs } from '@/server/db/schema';
import { asc, eq } from 'drizzle-orm';

export const revalidate = 60;

export async function generateMetadata() {
  return { title: 'FAQ — TrG Studio', description: 'Frequently asked questions about TrG_studio preorder process, payments, and delivery.' };
}

export default async function FAQPage() {
  const { settings, categories, discountBar } = await getChromeData();

  let faqList: Array<{ id: string; question: string; answer: string }> = [];
  try {
    faqList = await db.select({ id: faqs.id, question: faqs.question, answer: faqs.answer }).from(faqs).where(eq(faqs.isPublished, true)).orderBy(asc(faqs.sortOrder));
  } catch { /* empty state */ }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };

  return (
    <SiteChrome settings={settings} categories={categories} discountBar={discountBar}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-hero"><div className="container"><span className="breadcrumb">Home / FAQ</span><h1>Frequently asked questions</h1><p>Everything you need to feel confident before sending your picks.</p></div></section>
      <div className="container" style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 80 }}>
        {faqList.length > 0 ? (
          <FaqAccordion faqs={faqList} />
        ) : (
          <div className="empty-state">
            <h2>No questions yet</h2>
            <p>Have a question? Reach out and we will help.</p>
          </div>
        )}
        <div className="editorial-band" style={{ marginTop: 54, borderRadius: 18 }}>
          <div className="editorial-content">
            <h2>Still have questions?</h2>
            <p>We are one message away.</p>
            <a href="/contact" className="button button-gold">Contact us</a>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
