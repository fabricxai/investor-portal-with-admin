# fabricXai Investor Portal

The fabricXai Investor Portal is a full-stack platform for managing investor relations, fundraising operations, and data room access for [fabricXai](https://fabricxai.com/investors) — the AI agent platform for garment manufacturing.

---

## Features

### Investor-Facing Portal (`/portal`)

- **Email Gate** — Visitors enter name + email; returning investors log in with password. Differentiates new visitors, potential investors, and actual (invested) investors automatically.
- **Potential Investor Dashboard** — Tier-based access (Tier 0/1/2) with:
  - AI-powered Q&A copilot (RAG-backed, powered by Claude)
  - Interactive pitch deck preview (2-slide teaser with full deck request)
  - Product demo — 22 AI agents with live/upcoming status and links
  - Team profiles — founders + advisors with LinkedIn
  - Traction timeline — milestones from R&D through POC to seed
  - Use of Funds breakdown — visual allocation chart
  - Investor FAQ — expandable Q&A by category
  - Document data room — tier-gated download access
  - Investment interest form (Tier 1+)
  - Schedule a call / contact founders
- **Actual Investor Dashboard** — Password-protected dashboard for invested stakeholders:
  - Live KPI cards (MRR, factories live, agents deployed, runway)
  - Company progress & round status with progress bar
  - Investor updates feed (milestone, financial, product, team)
  - Full document access with download
  - Cap table summary with ownership visualization
  - Contact page with LinkedIn + WhatsApp
  - AI copilot with full knowledge base access
- **Responsive Design** — Mobile, tablet, and desktop optimized with sticky horizontal nav on mobile, collapsible sidebar, and adaptive grid layouts.

### Admin Dashboard (`/admin`)

- **Investor Management** — View, edit, and manage all potential and actual investors with tier-based access control, fit scoring, and visit tracking.
- **Actual Investors** — Track invested amounts, instruments, dates; convert potential investors to actual.
- **Document Management** — Upload, index (RAG), and manage investor documents with tier-gated permissions.
- **Metrics Dashboard** — Company KPIs (MRR, ARR, factories, agents, burn rate, runway, round status).
- **Investor Updates** — Create and publish categorized updates (milestone, financial, product, team).
- **AI Copilot** — Admin-facing AI assistant for answering questions about the knowledge base.
- **Outreach Suite**:
  - **Pipeline** — Stage-based investor pipeline management
  - **Discover** — AI-powered investor discovery with fit scoring
  - **Email Composer** — AI-generated personalized investor emails
  - **Follow-ups** — Automated follow-up scheduling and generation
  - **Statistics** — Campaign analytics and engagement tracking

### AI & Intelligence

- **RAG Pipeline** — Documents are chunked, embedded (Google `text-embedding-004`), and stored in Supabase `pgvector` for semantic search.
- **Claude Copilot** — Anthropic Claude answers investor questions using RAG-retrieved context, with tier-appropriate access levels.
- **AI Email Generation** — Claude generates personalized outreach emails based on investor profiles and company data.
- **Investor Discovery** — AI-assisted matching of potential investors based on thesis fit, stage, and geography.

---


### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Access Tiers

| Tier | Description | Capabilities |
|------|-------------|-------------|
| **Tier 0** | New visitor / unverified | View portal, see blurred metrics, request access |
| **Tier 1** | Approved potential investor | AI copilot chat, pitch deck, product demo, investment interest form |
| **Tier 2** | Full access investor | Everything in Tier 1 + document downloads, full data room |
| **Actual Investor** | Invested stakeholder | Dedicated dashboard with live KPIs, updates, cap table, full docs |

---

## Brand

- **Name**: fabricXai (lowercase f, uppercase X, lowercase ai)
- **Colors**: Navy `#080E18`, Aqua `#57ACAF`, Yellow `#EAB308`
- **Fonts**: Sora (headings), DM Sans (body), JetBrains Mono (mono)

---

## Key Build Notes

- `pdf-parse` v2 does not export `.default` — use `(module as any).default || module` pattern
- `pptx-text-parser` needs `(parse as any)(buffer)` type assertion
- `useSearchParams()` must be wrapped in a `<Suspense>` boundary
- External clients (Resend, Anthropic) are lazy-initialized via getter functions to avoid build-time errors
- Server pages using Supabase require `export const dynamic = 'force-dynamic'`
- Tailwind v4 uses `@import "tailwindcss"` — no `tailwind.config.ts` file

---

## License

Proprietary. Confidential. Not for distribution.

fabricXai (SocioFi) - Dhaka, Bangladesh
