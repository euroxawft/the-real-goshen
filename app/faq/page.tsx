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
          <>
            <div className="empty-state" style={{ marginBottom: 30 }}>
              <h2>Common questions</h2>
              <p>Here are the things customers ask us most.</p>
            </div>
            <FaqAccordion
              faqs={[
                { id: 'static-1', question: 'How do preorders work?', answer: 'Choose a preorder piece and send it to us with your interests. We confirm payment and delivery details with you directly, and your piece usually arrives within 4 to 8 weeks.' },
                { id: 'static-2', question: 'Do I pay on the website?', answer: 'No. The website is for browsing and building your wishlist. There is no online payment — we arrange payment with you personally when you are ready to order.' },
                { id: 'static-3', question: 'How will I know my order is confirmed?', answer: 'After you send your interests, we reach out by email or WhatsApp to confirm availability, payment, and delivery. You also get an email with your reference number right away.' },
                { id: 'static-4', question: 'Can I request a piece that is not listed?', answer: 'Yes. Tell us what you are looking for — brand, colour, size, or budget — and we will do our best to source it for you.' },
                { id: 'static-5', question: 'How do I care for my bags and shoes?', answer: 'Keep them away from direct sunlight and moisture, stuff bags with paper to hold their shape, and wipe gently with a soft dry cloth. Store each piece in its dust bag.' },
                { id: 'static-6', question: 'Do you deliver outside your city?', answer: 'Yes, we deliver nationwide. Delivery costs and timelines are confirmed with you before payment.' },
              ]}
            />
          </>
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
