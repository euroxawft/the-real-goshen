# Project memory

## Product intent & audience

- Store/e-commerce application with an admin dashboard.
- Admin features include: products list, customer interests, contact messages.
- Storefront side exists (products are browsable) but details are minimal so far.

## Brand personality & voice

- Not yet established; admin UI is functional/dashboard-oriented.

## Visual design & UX direction

- Admin pages use tabbed filters (`tab=all`), pagination (`page`, `limit`), and search (`q`).
- List views load data from API routes and show "could not load, try again" style error states on failure.
- shadcn/ui + Tailwind + lucide-react are the UI stack (per project setup).

## Decisions, constraints & rationale

- Next.js App Router; API routes under `/api/admin/` (`products`, `interests`, `contacts`).
- Query parsing helper `parseQuery` expects a full URL, not a bare query string.
- Root-cause bug (fixed): routes did `new URL(req.url).search` then passed `?page=1&limit=12` into `new URL()` again → `ERR_INVALID_URL`. Fix: pass full `req.url` through.
- Known data: ~12 products, 1 interest, 1 contact message expected to load after fix + redeploy.

## Open questions & assumptions

- Full admin feature scope beyond products/interests/contacts is unknown.
- Storefront design and public-facing pages not yet explored.
- Whether other routes share similar double-URL parsing patterns should be audited.