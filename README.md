# BackTrack - School Lost & Found

BackTrack is a student-focused lost-and-found web app for schools. It helps users report found items, browse recent listings, claim items with proof, and keeps staff/admins in control with approvals. The project includes a static multi-page site plus Supabase-backed data, auth, storage, and AI features (semantic search, image matching, and a chatbot).

## Table of contents
- Overview
- Key features
- Pages
- Tech stack
- Project structure
- Local development
- Supabase setup
- Edge functions
- Data model
- PWA/offline
- Accessibility
- Deployment
- License

## Overview
BackTrack is built primarily as a static HTML/CSS/JS website hosted at the repository root. It integrates directly with Supabase for authentication, database access, storage, and serverless functions. A separate Vite + React app exists in `backtrack-react` (currently standalone).

## Key features
- Report, browse, and claim lost-and-found items
- User authentication (email + Google OAuth)
- Admin panel for approving items and claims
- AI-powered semantic search with embeddings
- Image-based matching from uploaded photos
- Built-in chatbot for site help
- PWA support with offline fallback
- Accessibility tools (contrast, text size, reduced motion, keyboard shortcuts)

## Pages
- `index.html`: Marketing homepage + chatbot widget
- `browse.html`: Item search, filters, AI image matching
- `submit.html`: Submit found items
- `claim.html`: Claim workflow and proof submission
- `login.html`, `signup.html`: Auth flows
- `profile.html`: User items, claims, and settings
- `admin.html`: Admin review and approvals
- `map.html`: Interactive campus map view
- `features.html`: Feature overview
- `sources.html`: Sources and credits
- `offline.html`: Offline fallback page

## Tech stack
- HTML, CSS, and vanilla JavaScript (static site)
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Postgres + `pgvector` for semantic search
- Deno-based Edge Functions in `supabase/functions`
- Optional Vite + React app in `backtrack-react`

## Project structure
```
.
├── index.html
├── browse.html
├── submit.html
├── claim.html
├── login.html
├── signup.html
├── profile.html
├── admin.html
├── map.html
├── features.html
├── sources.html
├── offline.html
├── css/
│   ├── base.css            # Shared resets, page transitions, skip-to-content
│   ├── design-system.css   # Design tokens, buttons, typography scale
│   ├── nav-auth.css        # Navigation bar, user menu, auth UI
│   ├── theme.css           # Dark/light mode overrides
│   ├── admin.css           # Admin panel layout and components
│   ├── rewards.css         # Rewards page styles
│   └── leaderboard.css     # Leaderboard component styles
├── js/
│   ├── supabase.js
│   ├── nav-auth.js
│   ├── accessibility.js
│   └── 3d-animation.js
├── supabase/
│   └── functions/
├── database-schema.sql
├── manifest.json
├── sw.js
└── backtrack-react/
```

## Local development

### Static site (root)
Use any local static server so service workers and OAuth redirects work correctly.

```bash
python3 -m http.server 5173
```

Then open:
```
http://localhost:5173/index.html
```

Notes:
- Service workers only register on `http://localhost` or HTTPS.
- The site expects Supabase credentials in `js/supabase.js`.

### React app (optional)
The React app is separate and not wired into the static site.

```bash
cd backtrack-react
npm install
npm run dev
```

## Supabase setup

1) Create a new Supabase project.
2) Run the SQL schema in `database-schema.sql` in the Supabase SQL editor.
3) Create a public Storage bucket named `images`.
4) Configure Auth providers (email + Google).
   - The Google OAuth redirect should include your site URL with `/login.html`.
5) Update `js/supabase.js` with your project URL + anon key.

### Required Edge Function env vars
Set these in Supabase (or when running functions locally):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`

## Edge functions
All functions live in `supabase/functions`.

- `chatbot`
  - POST `{ "message": "..." }`
  - Returns `{ "reply": "..." }`
- `search-items`
  - POST `{ "query": "...", "filters": { ... } }`
  - Returns `{ "items": [...] }`
- `image-match`
  - POST `{ "imageBase64": "data:image/png;base64,..." }`
  - Returns `{ "keywords": [...], "query": "..." }`
- `create-item`
  - POST `{ "item": { ... } }`
  - Returns `{ "item": { ... } }` with AI tags + embedding

### AI provider behavior
`supabase/functions/_shared/openai.ts` uses:
- Gemini 1.5 (if `GEMINI_API_KEY` is set), or
- OpenAI (`gpt-4o-mini` for chat/labeling + `text-embedding-3-small` for embeddings)

## Data model
Defined in `database-schema.sql`:
- `items`: lost/found items, AI tags/caption, embeddings
- `claims`: item claim requests + verification data
- `admins`: admin users who can approve items and claims
- `categories`, `locations`: optional metadata tables

Row-level security policies are included to protect user data.

## PWA / offline support
- `manifest.json` defines the app install experience
- `sw.js` pre-caches core pages and serves `offline.html` on failed navigation

## CSS Architecture

The project uses a layered CSS approach to eliminate duplication:

1. **`css/base.css`** — Global resets, body defaults, page transitions, skip-to-content link
2. **`css/design-system.css`** — Design tokens (colors, spacing, typography), button styles, responsive breakpoints, WCAG-compliant touch targets
3. **`css/nav-auth.css`** — Shared navigation bar, user avatar/dropdown, sign-in button
4. **`css/theme.css`** — Dark/light mode variable overrides for all components
5. **Page-specific CSS** — Inline `<style>` or dedicated files (admin.css, rewards.css) for page-unique styles

## Accessibility

- Skip-to-content links on every page
- ARIA labels on navigation, tabs, and interactive elements
- Keyboard navigation with focus-visible styles
- Minimum 44px touch targets (WCAG / Apple HIG compliant)
- `js/accessibility.js` provides:
  - High contrast, text size, and reduced motion toggles
  - Keyboard shortcuts + help overlay
  - Toast notifications and screen reader announcements

## Deployment
- Deploy the root files as a static site (any static host works).
- Ensure `sw.js` and `manifest.json` are served from the site root.
- Use HTTPS in production for PWA + OAuth.

## License
No license file is included yet.
