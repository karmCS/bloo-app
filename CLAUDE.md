# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run preview      # Preview production build
```

No test framework is configured. Type-check and lint are the primary correctness gates.

## Architecture Overview

**bloo-app** is a meal-discovery and vendor-management SPA for a small food marketplace. It is a Vite + React + TypeScript frontend deployed to Vercel, backed by Supabase (PostgreSQL + Storage) and Clerk for auth.

### Routing (React Router v7)

| Route | Component |
|---|---|
| `/` | `Homepage` — meal catalog, vendor filter pills, meal-of-week hero |
| `/restaurant/:vendorId` | `RestaurantPage` — single vendor detail |
| `/admin` | `AdminPanel` — superadmin dashboard |
| `/admin/vendor/:slug` | `VendorPanel` — vendor-scoped dashboard |
| `/login` | Clerk `<SignIn>` |
| `/auth-redirect` | Clerk post-login redirect handler |

All `/admin*` routes are wrapped in `<ProtectedRoute>`, which checks the `vendor_users` table before rendering.

### Auth Stack

- **Clerk** handles OAuth/SSO and session management.
- **Supabase RLS** enforces data access using the Clerk JWT — **not** Supabase's own auth.
- `src/lib/supabaseWithAuth.ts` exports `getSupabaseWithAuth()`, which injects the Clerk JWT into every Supabase request by overriding `global.fetch`. **Always use this inside authenticated components/hooks**, never the plain `supabase` client from `src/lib/supabase.ts`.
- `vendor_users` is the application's user table (no Supabase Auth FK). Roles are `superadmin` or `vendor`. Superadmins have no `vendor_id`; vendors are scoped to one.
- PostgreSQL helper functions `is_superadmin()` and `current_vendor_id()` are used in all RLS policies.

### Database Schema (Supabase)

| Table | Purpose |
|---|---|
| `meals` | Meal catalog — nutrition, ingredients, tags, price, `is_meal_of_week` (max 1) |
| `vendors` | Partner restaurants — slug, payment handles (Venmo/Zelle), cuisine tags |
| `vendor_users` | Platform users — links `clerk_user_id` to a role and optional vendor |
| `orders` | Purchase history — `items (jsonb)`, status fields, `stripe_session_id` (reserved) |
| `cart_items` | Anonymous cart via `session_id` — no auth required |

Migrations live in `supabase/migrations/` and are the authoritative schema source.

### Serverless API

`api/estimate-macros.ts` is the only Vercel serverless function. It accepts a POST with an ingredients array, calls Claude Haiku, and returns `{calories, protein, carbs, fats}`. The Anthropic API key is a server-only env var.

### State & Data Fetching

No global state library. All data lives in custom hooks:

- `useMeals` / `useMealsByVendor` / `useActiveVendors` — Supabase queries, return `{data, loading, refetch}`
- `useReveal` — IntersectionObserver that adds `.in` class for scroll-triggered CSS animations
- `useCountUp` — Animates numeric stats in the admin panel

### Styling

Tailwind CSS with custom tokens defined in `tailwind.config.js`:
- **Colors:** `primary` (#7CB9E8), `accent` (#D4522A), `macro-green` (#2D6A4F), plus neutrals and semantic colors
- **Fonts:** `Epilogue` (sans), `Fraunces` (display/brand) loaded via Google Fonts
- Custom animations (`animate-fadeIn`, `animate-slideUp`, `anim-float`) are defined in `src/index.css`

### Image Uploads

`src/lib/uploads.ts` validates files client-side (JPEG/PNG/WebP, max 5 MB) before upload to Supabase Storage. `src/components/ImageUpload.tsx` provides the drag-drop UI.

## Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_AGENTATION_ENDPOINT=http://localhost:4747
```

**Backend / Vercel** (`.env.local`):
```
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=
ORDER_NOTIFICATION_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_APP_URL=
```

## Key Conventions

- **Always use `getSupabaseWithAuth()`** for any query that touches RLS-protected tables inside authenticated contexts.
- **Shared TypeScript types** (`Vendor`, `Meal`) live in `src/lib/supabase.ts`. Add new table types there.
- **Modal pattern:** State owned by the parent page; close via `setTimeout` (300 ms) to allow exit animations before unmounting.
- **New migrations** go in `supabase/migrations/` with a timestamp prefix. Run against the project with the Supabase CLI.
- `AdminPanel.tsx` is intentionally large (858 lines). Prefer extracting new admin sub-sections into separate components rather than adding to it.

# Frontend Design Skill

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
- **Differentiation**: What makes this UNFORGETTABLE?

Choose a clear conceptual direction and execute it with precision.

## Aesthetics Guidelines

- **Typography**: Avoid generic fonts (Arial, Inter, Roboto). Choose distinctive display + refined body font pairings.
- **Color**: Commit to a cohesive aesthetic. CSS variables for consistency. Dominant colors with sharp accents.
- **Motion**: CSS animations for HTML. Motion library for React. Staggered reveals on load, hover states that surprise.
- **Layout**: Unexpected asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds**: Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, grain overlays.

NEVER use: purple gradients on white, Space Grotesk, Inter, predictable layouts, cookie-cutter components.

Match implementation complexity to the vision. Elegance = executing the vision well.