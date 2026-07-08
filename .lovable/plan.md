## 1. Homepage restyle (Wix screenshots as reference)

Refresh `src/routes/index.tsx` visuals only — no logic changes:

- **Hero:** deep navy (`#1B3A8A`-style) background, cream/off-white top strip that carries the enlarged logo. Big rounded "ADMISSION OPEN 2025-26" pill in bold red/yellow over the hero image. Left/right chevron arrows on the carousel image (kept the same girl-with-rocket image + a second slide).
- **Intro paragraph section:** full-bleed navy panel with large centered white serif-ish body copy: "Early years development is critical…" (the exact Wix paragraph).
- **Vision / Mission / Values:** three stacked white rounded cards on navy, each with a circular colored icon on top (target = red, rocket = blue, heart = yellow), sketchy hand-drawn title font style using existing display font. Content taken from screenshot #3.
- Keep existing sections below (Programs, Leadership, Activities, Admissions form, Contact, Footer) but retune spacing/colors to match the new navy+cream palette.

## 2. Sidebar socials

In `src/routes/dashboard.tsx` sidebar, add a "Follow us" group at the bottom with three icon buttons opening in a new tab:
- Instagram → saved reel URL
- Facebook → saved reel URL
- WhatsApp → `https://wa.me/918400100348`

## 3. Blog feature

### Schema (one migration)
- `blog_categories` — `name`, `slug` (unique)
- `blog_posts` — `title`, `slug` (unique), `excerpt`, `cover_url`, `body_md` (markdown), `category_id`, `author_id → profiles`, `status` ('draft' | 'published'), `published_at`, `created_at`, `updated_at`, `tags text[]`
- `blog_comments` — `post_id`, `author_id → profiles`, `body`, `status` ('pending' | 'approved' | 'rejected'), `created_at`

RLS:
- `blog_posts`: public SELECT when `status='published'`; admin full CRUD via `has_role(auth.uid(),'admin')`
- `blog_categories`: public SELECT; admin write
- `blog_comments`: public SELECT when `status='approved'`; authenticated INSERT (`author_id = auth.uid()`, forced `pending`); admin moderate/delete
- Grants: `anon` SELECT on posts/categories/approved comments; `authenticated` full needed subsets; `service_role` ALL

### Public routes
- `/blog` — grid of published posts, category filter chips
- `/blog/$slug` — cover, title, meta, markdown body rendered, approved comments list, sign-in-gated comment box (parents/students post → `pending`)

### Admin route
- `/dashboard/blog` — table of all posts (draft/published toggle, edit, delete), "New post" button opens editor drawer with title, slug (auto), category picker, tags input, cover image upload (reuses `gallery` storage bucket), excerpt, markdown body, publish/save-draft. Second tab: **Categories** (CRUD). Third tab: **Comments moderation** (approve/reject queue).

### Server functions (`src/lib/blog.functions.ts`)
Public: `listPublishedPosts({ category? })`, `getPostBySlug(slug)`, `listApprovedComments(postId)`.
Auth: `submitComment({ postId, body })`.
Admin: `listAllPosts`, `upsertPost`, `deletePost`, `listCategories`, `upsertCategory`, `deleteCategory`, `listPendingComments`, `moderateComment`.

## 4. Separate public page per function

Split the long homepage into dedicated routes so each is SSR/SEO-friendly with its own `head()`:

- `/programs` — playgroup / nursery / LKG / UKG details
- `/admissions` — the admissions form + fee highlights + campus tour CTA
- `/activities` — the AI child-playing video + activity gallery
- `/leadership` — Reema Mishra (founder), Seema Bansal, Taruna Bhaskar
- `/campuses` — Vrindavan + Gomti Nagar branch cards with maps/phone
- `/contact` — phones, emails, WhatsApp, socials, hours
- `/blog` — (from item 3)

Homepage keeps the hero, one-liner about, three vision cards, and short teasers linking into each of the above. Header nav updated to: Home · About · Programs · Admissions · Activities · Blog · Contact. Mobile menu mirrors this. Existing hash-anchor scroll code is removed for these promoted sections; internal links become `<Link to="/…">`.

## Technical notes
- Blog admin gated by an admin-only server fn check (`has_role(uid,'admin')`) inside each admin server fn — no new layout route.
- Comments require sign-in via `requireSupabaseAuth`; unauthenticated visitors see "Sign in to comment" link to `/auth`.
- Markdown rendered with a lightweight renderer (add `marked` + basic sanitization via `DOMPurify`); no rich WYSIWYG this pass.
- Cover images stored in existing `gallery` bucket under `blog/`.
- All new routes get unique `head()` title/description/og; homepage keeps og:image.
- No changes to existing dashboard tables/schemas.

## Out of scope (say the word to add)
- Rich WYSIWYG editor, scheduled publishing, email notifications on new comment, comment threading, blog RSS, per-post og:image auto-generation.

Approve and I'll implement in this order: migration → blog server fns + admin page → public blog pages → split homepage sections into routes → sidebar socials → homepage restyle.