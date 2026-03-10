# Aesthetic Lounge — Project Guide

## Quick Start
```bash
npm install
cp .env.example .env.local  # fill in credentials
npm run dev                  # http://localhost:3000
```

## Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Database**: Neon Serverless Postgres (project: `lively-breeze-55853433`)
- **Hosting**: Netlify (auto-deploy from GitHub `main` branch)
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) for content pipeline
- **Images**: fal.ai Nano Banana Pro for AI-generated images
- **Auth**: NextAuth (Google OAuth) + legacy OTP cookie (`al_session`)

## Important Neon Branches
- **Netlify branch**: `br-small-dew-aj8s6l7d` (this is what the live site uses via `DATABASE_URL`)
- **MCP default branch**: `br-late-dew-aja6usa5` (different schema — DO NOT confuse)
- When debugging DB issues, always query the Netlify branch explicitly

## Architecture

### Public Website (~85 pages)
- `/` — Homepage with hero, treatments, before/after, gallery
- `/services/[slug]` — 66 treatment pages
- `/book` — Booking form → `/api/booking` → `al_appointments` + `al_leads`
- `/contact` — Contact form → `/api/lead` → `al_leads`
- `/lp/[slug]` — Landing pages for ad campaigns
- `/gallery`, `/about`, `/doctors`, `/promotions`, `/blog`

### Staff Dashboard (`/dashboard/*`)
- `/dashboard/leads` — Kanban with lead scoring
- `/dashboard/appointments` — Calendar management
- `/dashboard/marketing` — Marketing Studio (AI content pipeline)
- `/dashboard/marketing/brand-assets` — Google Drive asset manager
- `/dashboard/conversations` — Unified inbox (IG comments, WhatsApp)
- `/dashboard/analytics` — Revenue, leads, GA4 data
- `/dashboard/ads` — Meta ad campaign management
- `/dashboard/settings` — Staff management, RBAC

### API Routes
- `/api/lead` — Public lead capture (no auth)
- `/api/booking` — Public appointment booking (no auth)
- `/api/al/pipeline` — AI content pipeline (SSE streaming, auth required)
- `/api/al/status` — Pipeline health check
- `/api/al/drafts` — Draft queue management
- `/api/dashboard/*` — All dashboard APIs (auth required)
- `/api/webhooks/meta` — Meta Instant Form webhook
- `/api/webhooks/meta/conversations` — WhatsApp/IG DM webhook

### Key Libraries (`/src/lib/`)
- `db.ts` — Neon Postgres client (`@neondatabase/serverless`)
- `auth.ts` — Session management (NextAuth + legacy cookie)
- `capi.ts` — Meta Conversions API (server-side events)
- `al-pipeline.ts` — AI pipeline: Claude calls, chat history, drafts, decision log
- `google-drive.ts` — Google Drive API for brand assets
- `tracking.ts` — Client-side Meta Pixel + custom events
- `utm.ts` — UTM parameter capture + Meta cookie (fbp/fbc)
- `lead-assignment.ts` — Round-robin lead assignment to staff

## Database Tables (Netlify branch)
| Table | Purpose |
|-------|---------|
| `al_leads` | Lead records (phone, email, treatment, UTMs, scoring) |
| `al_appointments` | Booking requests |
| `al_staff` | Staff accounts with roles |
| `al_pipeline_drafts` | AI-generated content drafts |
| `al_decision_log` | AI agent decision audit trail |
| `al_agent_memory` | Agent instructions + memory (6 agents) |
| `n8n_chat_histories` | Chat history for AI agents (JSONB `message` column) |
| `al_behavior_events` | Visitor behavior tracking |
| `al_conversations` | WhatsApp/IG message threads |
| `al_inbox_messages` | Unified inbox messages |
| `al_campaigns` | Meta ad campaigns |

## AI Content Pipeline
The pipeline uses 6 AI agents (orchestrator, researcher, copywriter, designer, publisher, analyst) stored in `al_agent_memory`. Each agent has instructions and learned memory.

Pipeline flow: Orchestrate → Research → Write Copy → Design → Publish

The `/api/al/pipeline` endpoint uses **SSE streaming** with keepalive pings every 5s to prevent Netlify's 26s inactivity timeout. Frontend reads the stream in real-time.

## Meta Integration (DO NOT MODIFY)
- **Pixel**: Client-side tracking via `MetaPixel.tsx` (consent-gated)
- **CAPI**: Server-side events via `capi.ts` (Lead, Schedule, Contact)
- **Instant Forms**: Webhook at `/api/webhooks/meta` → DB insert → CAPI attribution
- **Ads**: Instagram ONLY, ABO only, $300 CAD/month budget cap
- All Meta platform IDs and tokens are in Netlify env vars

## Environment Variables
Required in `.env.local` and Netlify:
```
DATABASE_URL=              # Neon connection string
ANTHROPIC_API_KEY=         # Claude API
FAL_KEY=                   # fal.ai image generation
META_PIXEL_ID=             # Meta Pixel
META_ACCESS_TOKEN=         # Meta Graph API
META_APP_ID=               # Meta App
META_APP_SECRET=           # Meta App Secret
META_WEBHOOK_VERIFY_TOKEN= # Webhook verification
NEXTAUTH_SECRET=           # NextAuth session encryption
NEXTAUTH_URL=              # Site URL for NextAuth
GOOGLE_SA_CLIENT_EMAIL=    # Google service account
GOOGLE_SA_PRIVATE_KEY=     # Google service account key
GOOGLE_SA_PROJECT_ID=      # Google Cloud project
```

## Brand
- **Colors**: Gold `#B8924A`, Cream `#FAF9F6`, Dark `#1A1A1A`
- **Fonts**: Playfair Display (headings), Inter (body)
- **Style**: Clinical-luxury, white & gold theme
- **Disclaimer**: "Individual results may vary. Consult with our medical professionals."
- **Clinic**: DHA Phase 7, Lahore, Pakistan

## Rules
- NEVER modify running Meta ad campaigns or pixel config
- NEVER push secrets/env files to GitHub
- All lead forms must fire both client-side (fbq) AND server-side (CAPI) events
- Use `source` field in al_leads inserts (NOT NULL constraint): 'website', 'booking', 'meta_form'
- The `n8n_chat_histories.message` column is JSONB — use `::jsonb` cast
- Pipeline routes MUST use SSE streaming to avoid Netlify timeout
