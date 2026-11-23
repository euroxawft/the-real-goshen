# TrG_studio — Lagos Fashion & Accessories Store

A production-ready e-commerce storefront for a Lagos-based women's accessories brand. Customers browse a curated edit of bags, shoes, and accessories, submit "interests" (no online payment), and the store owner manages everything from a secure admin dashboard.

Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, **Drizzle ORM** (Neon Postgres), and email via **Brevo** or **Resend**.

---

## Table of contents

1. [How the system works](#how-the-system-works)
2. [Public user flow](#public-user-flow)
3. [Admin flow](#admin-flow)
4. [Architecture](#architecture)
5. [Database schema](#database-schema)
6. [Email system](#email-system)
7. [API reference](#api-reference)
8. [Environment variables](#environment-variables)
9. [Getting started](#getting-started)

---

## How the system works

TrG_studio is not a traditional checkout store. There is **no payment on the website**. Instead, the flow is:

1. **Browse** — Visitors explore products by category, availability (ready stock vs preorder), or sale status.
2. **Express interest** — A visitor adds items to their cart and submits an "interest" with their name, email, and phone. No account is needed.
3. **Email notifications fire** — The customer gets a confirmation email with their reference number and item details. The store owner gets a notification email with the customer's contact info and order estimate.
4. **Human confirmation** — The store owner contacts the customer (via WhatsApp or email) to confirm availability, payment, and delivery.
5. **Admin tracking** — The owner manages interests in the admin dashboard: mark as contacted, confirmed, completed, or cancelled. They can send reminders, resend confirmations, and bulk-update statuses.

This keeps the process personal — the owner talks to every customer directly before anything is shipped.

### Key concepts

| Concept | Description |
|---|---|
| **Interest** | A customer's submitted selection of items. Like a "wish list order" — no payment, just an expression of intent. Each gets a reference like `TRG-AB12CD`. |
| **Preorder** | Products made-to-order after confirmation. Typically arrive in 4–8 weeks. Lead time is configurable per product and globally. |
| **Ready stock** | Products physically in stock in Lagos. Can sell out (tracked via stock status). |
| **Discount event** | A time-limited sale. Can apply to all products or a single product. Shows a countdown bar on the storefront. |
| **Contact message** | A general enquiry through the contact form (separate from interests). Auto-replies with subject-specific copy. |

---

## Public user flow

### Home page (`/`)

- Hero section with the store's headline and call-to-action buttons
- Featured products rail (admin-curated)
- Shop by category tiles
- "How it works" steps explaining the interest-based process
- Active discount banner with live countdown (if any)
- Latest journal/blog posts
- WhatsApp call-to-action

### Products (`/products`)

- Filter by category, availability (preorder/ready stock), sale status
- Search by name
- Sort by newest or on-sale
- Each product card shows image, name, price (with struck-through original price if discounted), availability badge, and "Add to interests" button
- 24 products per page, paginated

### Product detail (`/products/[slug]`)

- Image gallery (up to 8 images) with thumbnail navigation
- Price with discount badge if applicable
- Availability card: preorder lead time or stock status
- Product description
- "Add to interests" button (adds to cart) and "Chat on WhatsApp" deeplink
- Trust badges (direct support, curated pieces, updates)
- Related products rail
- JSON-LD structured data for SEO

### Cart (`/cart`)

- Lists all selected items with images, quantities, and line totals
- Shows estimated total (prices are estimates, not final)
- Applies active discounts automatically
- "Submit interest" button leads to the checkout form

### Submit interest (`/cart/submit`)

- Customer enters name, email, phone, and optional note
- Honeypot field for spam prevention
- Rate-limited (5 submissions per hour per IP)
- On success: reference number shown, email confirmation sent, store owner notified
- If preorder items are included, lead time text is displayed

### Blog (`/blog`)

- Published journal posts with cover images, excerpts, and read-time estimates
- Click through to full article (`/blog/[slug]`)

### FAQ (`/faq`)

- Accordion of published FAQs
- FAQPage structured data for SEO
- Fallback CTA to contact page if no questions answered

### About (`/about`)

- Store story and brand values
- Configurable from admin settings (body text and image)
- Three value pillars: Considered, Confident, Personal
- Editorial CTA band linking to products

### Contact (`/contact`)

- Contact form with name, email, phone (optional), subject, and message
- Subject options: general, order, product, partnership, complaint
- Each subject triggers a different auto-reply email
- Honeypot + rate limiting for spam protection
- Store owner gets notified by email
- Sidebar with WhatsApp link, store email, business hours, and location

---

## Admin flow

### Setup (`/admin/setup`)

- First-time setup: create the admin account with name, email, and password
- Protected by `ADMIN_SETUP_SECRET` env var
- Only available when no admin exists yet

### Login (`/admin/login`)

- Email and password authentication
- JWT access token (15 min) + refresh token (7 days, rotating)
- HttpOnly cookies — tokens never touch JavaScript
- Refresh token rotation: each refresh issues a new token and invalidates the old one (reuse detection)

### Dashboard (`/admin`)

- Overview stats: total products, interests, contacts, blog posts, FAQs
- Recent activity feeds
- Quick links to each management section

### Products (`/admin/products`)

- List all products with filters and pagination
- Create new product: name, slug (auto-generated), description, price, category, images (up to 8), availability, lead time, stock status, featured flag, publish toggle
- Edit / duplicate / publish / delete products
- Bulk actions: bulk publish, bulk delete

### Interests (`/admin/interests`)

- Tabbed view: today / past / all
- Filter by status (new, contacted, confirmed, completed, cancelled)
- Search by reference, customer name, or email
- Detail view (`/admin/interests/[id]`) shows full item breakdown, customer contact, reminder history
- Actions: update status, send reminder email (24h cooldown), resend confirmation email
- Bulk actions: mark done, cancel, delete
- Bulk remind with dry-run preview

### Contacts (`/admin/contacts`)

- List contact messages with status filter and search
- Detail view (`/admin/contacts/[id]`) shows message, customer info, and reply thread
- Reply to customer (sends email and creates a reply record)
- Resend a reply if the email failed
- Update status: new → read → replied → closed

### Discounts (`/admin/discounts`)

- Create discount events: name, scope (all products or single product), percentage (1–90%), start/end dates
- Toggle active/inactive
- Active discounts show a countdown bar on the storefront and automatically apply to product prices

### Categories (`/admin/categories`)

- Create, edit, delete, and reorder categories
- Each category has a name, slug, and optional image

### Blog (`/admin` — blog section)

- Create, edit, publish/unpublish blog posts
- Title, slug, excerpt, content, cover image, publish date
- Published posts appear on the public blog page

### FAQs (`/admin/faqs`)

- Create, edit, delete, and reorder FAQs
- Toggle published status
- Reorder via drag or up/down controls

### Settings (`/admin/settings`)

- **Store identity**: WhatsApp number, store email, Instagram/TikTok/Facebook URLs, address, business hours
- **Hero**: headline, subheadline, hero image
- **About page**: body text and image
- **Preorder defaults**: min/max lead time weeks, preorder note
- **Announcement bar**: text and active toggle

### Account

- Change password
- View and revoke active sessions
- Log out (current session) or log out everywhere

---

## Architecture

```
app/
  api/                    API routes (Route Handlers)
    admin/                Admin-only routes (requireAdmin guard)
    products/             Public product routes
    contact/              Contact form submission
    interests/            Interest submission
    settings/public/      Public settings
    search/               Product search
    health/               Health check
  admin/                  Admin UI pages
  [public pages]/         Home, products, blog, about, contact, cart, FAQ

components/
  public/                 SiteChrome (header/footer), ProductCard, ProductGallery, etc.
  admin/                  AdminLayout
  ui/                     shadcn/ui component library

server/
  db/                     Drizzle schema, database connection, seed data
  resources/              Business logic services (auth, products, interests, etc.)
  email/                  Email providers (Brevo, Resend) and sender chain
  common/
    email-templates/      HTML email template functions
    utils/                Env validation, tokens, cookies, formatting, escaping

lib/
  api/                    Client-side API wrappers (fetch helpers)
  cart/                   Client-side cart store (localStorage)
  chrome.ts               Server-side chrome data (settings + categories + discounts)
  chrome-client.ts        Client-side chrome hook
```

### Key design decisions

- **No online payment**: The entire flow is interest-based. Customers submit what they want; the owner confirms manually.
- **Server-side rendering with revalidation**: Public pages use `revalidate = 30–60s` for fresh content without full SSR cost.
- **JWT auth with rotating refresh tokens**: Access token (15 min) in HttpOnly cookie, refresh token (7 days) rotates on each use. Reusing an old refresh token revokes the session.
- **Email provider chain**: Primary provider (Brevo or Resend) is tried first; if it fails, the other is tried as fallback.
- **Rate limiting**: IP-based, stored in Postgres. Applied to contact form and interest submission (5/hour each).
- **Honeypot anti-spam**: A hidden `website` field — bots fill it, humans don't. If filled, the submission silently succeeds without creating a record.
- **Row-level security**: All tables use RLS policies scoped to `authenticated` or `anon, authenticated`.

---

## Database schema

| Table | Purpose |
|---|---|
| `admins` | Admin accounts (name, email, password hash) |
| `admin_refresh_tokens` | Rotating refresh tokens with revocation tracking |
| `categories` | Product categories (name, slug, image, sort order) |
| `products` | Products (name, slug, price, images, availability, lead time, stock, featured, published) |
| `discount_events` | Time-limited discounts (scope: all or single product, percentage, window) |
| `interests` | Customer interest submissions (reference, contact info, status, estimate, email tracking) |
| `interest_items` | Line items within an interest (product snapshot, price, quantity, availability) |
| `interest_reminders` | Log of reminder emails sent for an interest |
| `contacts` | Contact form submissions (name, email, subject, message, status) |
| `contact_replies` | Admin replies to contact messages (with email-sent tracking) |
| `blog_posts` | Journal articles (title, slug, excerpt, content, cover image, published) |
| `faqs` | FAQ entries (question, answer, sort order, published) |
| `site_settings` | Single-row store config (WhatsApp, email, socials, hero, about, preorder defaults) |
| `rate_limits` | IP-based rate limit counters |

---

## Email system

### Providers

Two providers are supported with automatic failover:

1. **Brevo** (primary by default) — uses `BREVO_API_KEY`, sends from `EMAIL_FROM_NAME <EMAIL_FROM_ADDRESS>`
2. **Resend** (fallback, or primary if `EMAIL_PROVIDER=resend`) — uses `RESEND_API_KEY`, sends from `RESEND_FROM_NAME <RESEND_FROM_EMAIL>`

The sender identities are **independent**: Brevo and Resend each have their own from-name and from-email, so you can use a Brevo-verified domain for Brevo and a Resend-verified domain for Resend without conflict.

### Templates

All templates are server-rendered HTML with inline styles (email-client safe), a logo header, gold accent line, and escaped user input:

| Template | Trigger | Recipient |
|---|---|---|
| `interestCustomerConfirmation` | Interest submitted | Customer |
| `interestAdminNotification` | Interest submitted | Store owner |
| `interestReminder` | Admin sends reminder | Customer |
| `contactAutoReply` | Contact form submitted | Customer (subject-specific copy) |
| `contactAdminNotification` | Contact form submitted | Store owner |
| `contactReplyToCustomer` | Admin replies to contact | Customer |

### Preview and test

- `GET /api/admin/email-preview?template=<name>` — renders any template as HTML in the browser
- `POST /api/admin/email-test` — sends a test email with sample data to any address

---

## API reference

### Public routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/settings/public` | Public store settings |
| GET | `/api/products` | Paginated product list (filters: category, availability, sort, featured, q) |
| GET | `/api/products/[slug]` | Single product detail |
| GET | `/api/products/[slug]/related` | Related products |
| GET | `/api/categories` | All categories |
| GET | `/api/blog` | Published blog posts |
| GET | `/api/blog/[slug]` | Single blog post |
| GET | `/api/faqs` | Published FAQs |
| GET | `/api/search` | Product search |
| GET | `/api/discounts/active` | Active discount event |
| POST | `/api/cart/price` | Cart pricing calculation (discounts applied) |
| POST | `/api/interests` | Submit an interest |
| POST | `/api/contact` | Submit a contact message |

### Admin routes (all require `requireAdmin`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/auth/setup` | First-time admin creation |
| GET | `/api/admin/auth/setup-status` | Check if admin exists |
| POST | `/api/admin/auth/login` | Login |
| POST | `/api/admin/auth/refresh` | Refresh access token |
| POST | `/api/admin/auth/logout` | Logout current session |
| POST | `/api/admin/auth/logout-all` | Logout all sessions |
| GET | `/api/admin/auth/me` | Current admin profile |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/counts` | Section counts |
| GET | `/api/admin/health` | Admin health (includes siteUrlIsPublic) |
| GET/POST | `/api/admin/products` | List / create products |
| GET/PATCH/DELETE | `/api/admin/products/[id]` | Read / update / delete product |
| POST | `/api/admin/products/[id]/duplicate` | Duplicate a product |
| PATCH | `/api/admin/products/[id]/publish` | Toggle publish |
| POST | `/api/admin/products/bulk` | Bulk actions |
| GET/POST | `/api/admin/categories` | List / create categories |
| GET/PATCH/DELETE | `/api/admin/categories/[id]` | Read / update / delete category |
| POST | `/api/admin/categories/reorder` | Reorder categories |
| GET/POST | `/api/admin/interests` | List / bulk remind |
| GET/PATCH | `/api/admin/interests/[id]` | Read / update interest |
| POST | `/api/admin/interests/[id]/remind` | Send reminder |
| POST | `/api/admin/interests/[id]/resend-confirmation` | Resend customer confirmation |
| POST | `/api/admin/interests/bulk` | Bulk status update |
| GET/POST | `/api/admin/contacts` | List contacts |
| GET/PATCH | `/api/admin/contacts/[id]` | Read / update contact |
| POST | `/api/admin/contacts/[id]/replies` | Reply to contact |
| POST | `/api/admin/contacts/[id]/replies/[replyId]/resend` | Resend a reply |
| GET/POST | `/api/admin/discounts` | List / create discounts |
| GET/PATCH/DELETE | `/api/admin/discounts/[id]` | Read / update / delete discount |
| PATCH | `/api/admin/discounts/[id]/toggle` | Toggle active |
| GET/POST | `/api/admin/blog` | List / create blog posts |
| GET/PATCH/DELETE | `/api/admin/blog/[id]` | Read / update / delete post |
| GET/POST | `/api/admin/faqs` | List / create FAQs |
| GET/PATCH/DELETE | `/api/admin/faqs/[id]` | Read / update / delete FAQ |
| POST | `/api/admin/faqs/reorder` | Reorder FAQs |
| GET/PATCH | `/api/admin/settings` | Read / update settings |
| POST | `/api/admin/uploads` | Image upload to R2 |
| GET | `/api/admin/email-preview` | Preview email template |
| POST | `/api/admin/email-test` | Send test email |
| PATCH | `/api/admin/account/password` | Change password |
| GET | `/api/admin/account/sessions` | List active sessions |
| DELETE | `/api/admin/account/sessions/[id]` | Revoke a session |
| POST | `/api/admin/auth/logout` | Logout |

### Cron routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/cron/stale-interests` | Finds interests 72h+ old without recent reminders (protected by `CRON_SECRET`) |

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` | Public site URL (used for email logos and links) |
| `DATABASE_URL` | Yes | — | Neon Postgres connection string |
| `JWT_ACCESS_SECRET` | Yes | dev default | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | dev default | Secret for signing refresh tokens |
| `ACCESS_TOKEN_TTL_MINUTES` | No | 15 | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | No | 7 | Refresh token lifetime |
| `ADMIN_SETUP_SECRET` | Yes | dev default | Secret required for first admin setup |
| `EMAIL_PROVIDER` | No | `brevo` | Primary email provider (`brevo` or `resend`) |
| `EMAIL_FROM_NAME` | No | `TrG_studio` | Brevo sender name |
| `EMAIL_FROM_ADDRESS` | No | `hello@example.com` | Brevo sender email |
| `RESEND_FROM_NAME` | No | `TrG_studio` | Resend sender name |
| `RESEND_FROM_EMAIL` | No | `onboarding@resend.dev` | Resend sender email |
| `STORE_NOTIFY_EMAIL` | No | `store@example.com` | Where store notifications are sent |
| `BREVO_API_KEY` | If using Brevo | — | Brevo API key |
| `RESEND_API_KEY` | If using Resend | — | Resend API key |
| `R2_ACCOUNT_ID` | For uploads | — | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For uploads | — | R2 access key |
| `R2_SECRET_ACCESS_KEY` | For uploads | — | R2 secret key |
| `R2_BUCKET_NAME` | For uploads | — | R2 bucket name |
| `R2_PUBLIC_URL` | For uploads | — | R2 public CDN URL |
| `DEFAULT_WHATSAPP_NUMBER` | No | — | Fallback WhatsApp number |
| `CRON_SECRET` | For cron | — | Secret for cron job routes |

---

## Getting started

### Prerequisites

- Node.js 18+
- A Neon Postgres database (connection string)
- A Brevo or Resend account (for email)
- Cloudflare R2 bucket (for image uploads, optional)

### Installation

```bash
npm install
```

### Environment setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Database

The schema is managed with Drizzle ORM. Push the schema to your database:

```bash
npm run db:push
```

Seed initial data (settings, sample categories, FAQs):

```bash
npm run db:seed
```

### Development

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

### First admin setup

1. Navigate to `/admin/setup`
2. Enter the `ADMIN_SETUP_SECRET` from your `.env`
3. Create your admin account with name, email, and password
4. You'll be redirected to `/admin/login`

### Production build

```bash
npm run build
npm start
```

### Audit scripts

The project includes four audit scripts in `scripts/`:

```bash
# Static — no server needed
npx tsx scripts/wiring-scan.ts    # Route guards, email wiring, mock data check
npx tsx scripts/emails.audit.ts   # Email template rendering, XSS escaping, content checks

# Live — needs running server + seeded DB
npx tsx scripts/api-smoke.ts      # API envelopes, auth flows, validation, 404s
npx tsx scripts/responsive.audit.ts  # Viewport testing (requires Playwright)
```

---

## License

Proprietary. All rights reserved.
