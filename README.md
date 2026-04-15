# bloo

> Blue-zone inspired meal delivery marketplace — browse, order, pay.

![React](https://img.shields.io/badge/React-TypeScript-blue) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black) ![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E)

A full-stack web app built to validate demand for a health-focused meal delivery concept. Real customers, real orders. Built fast using an AI-augmented dev workflow.

**Live:** [bloo-app.vercel.app](https://bloo-app.vercel.app)

---

## Features

- Full-screen meal detail modals with macro breakdowns
- Shopping cart + multi-step checkout flow
- Venmo/Zelle manual payment routing with confirmation page
- Transactional order confirmation emails via Resend
- Admin panel with drag-and-drop image upload to Supabase Storage
- Supabase Auth with protected `/admin` route
- Full meal management (add, edit, delete)
- Dietary tag filtering using PostgreSQL array functions

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS |
| Backend | Vercel Serverless Functions (`/api` routes) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend |
| Hosting | Vercel (auto-deploy from GitHub) |
| Fonts | Inter, Josefin Sans, DM Sans, Jost |

---

## AI-augmented dev workflow

This project was built using a three-tool AI workflow — each tool used for what it does best:

```
Bolt.new → Claude Code (VS Code) → git push → Vercel
```

### Bolt.new
Used for rapid UI scaffolding and visual iteration. Full component trees and pages generated from natural language prompts — cuts hours of boilerplate and lets design intent outpace implementation speed.

### Claude (Claude.ai + Claude Code)
Used for surgical multi-file edits, schema design, debugging, and architectural decisions. Claude Code in VS Code handles diffs across multiple files simultaneously — ideal for routing fixes, environment variable issues, and Supabase query logic.

### Cursor
Primary editor with AI-assisted autocomplete and inline edits. Tab completions are context-aware of the whole repo — especially useful when touching files outside what Bolt scaffolded.

---

## Local setup

```bash
git clone https://github.com/karmCS/bloo-app
cd bloo-app
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=you@example.com
```

```bash
npm run dev
```

---

## Project structure

```
src/
  pages/         Homepage, AdminPanel, Cart, Checkout, PaymentInstructions
  components/    MealModal, CartDrawer, ProtectedRoute, ImageUpload
  contexts/      CartContext
  lib/           supabase.ts (DB client + shared types)
api/
  send-order-email.ts   Vercel serverless — order confirmation emails
```

---

## What's next

- Search functionality
- Loading skeletons + micro-animations
- Mobile polish pass
- Discord bot for order/deploy notifications (Python + discord.py, hosted on Railway)
- Custom domain → unlocks full customer email delivery via Resend

---

*built by mark · [github.com/karmCS/bloo-app](https://github.com/karmCS/bloo-app)*
