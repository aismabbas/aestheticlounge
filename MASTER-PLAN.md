# Aesthetic Lounge — Master Plan: AI-Powered Clinic Suite

## Vision
One platform replaces GoHighLevel, manual employees, and disconnected tools.
Claude is the brain. n8n is the engine. Staff just monitors and approves.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     aestheticloungeofficial.com                     │
│                        (Next.js on Netlify)                         │
│                                                                     │
│  PUBLIC                          STAFF DASHBOARD (/dashboard)       │
│  ┌─────────────────────┐        ┌──────────────────────────────┐   │
│  │ Treatment Pages (80+)│        │ 🔐 Login (email + OTP)       │   │
│  │ Doctor Profiles      │        │                              │   │
│  │ Before/After Gallery │        │ Leads (pipeline view)        │   │
│  │ Booking Form         │        │ Clients (CRM)                │   │
│  │ WhatsApp Click       │        │ Appointments (calendar)      │   │
│  │ Meta Pixel + CAPI    │        │ Ads (create/monitor/pause)   │   │
│  │ UTM Tracking         │        │ Performance (live metrics)   │   │
│  │ Price Guide          │        │ Conversations (WhatsApp)     │   │
│  │ Blog/SEO             │        │ Content (approve queue)      │   │
│  └────────┬─────────────┘        │ Services (treatment CRUD)   │   │
│           │                      └──────────┬───────────────────┘   │
└───────────┼─────────────────────────────────┼───────────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NEON POSTGRES                               │
│                                                                     │
│  al_leads          al_clients        al_appointments                │
│  al_conversations  al_campaigns      al_services                    │
│  al_staff          al_analytics      al_content_queue               │
│  al_agent_memory   al_decision_log   al_reel_jobs                   │
│  al_whatsapp_templates               n8n_chat_histories             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      n8n AUTOMATION ENGINE                          │
│                                                                     │
│  EXISTING PIPELINE (6 agents)         NEW AGENTS                    │
│  ┌──────────────────────────┐        ┌──────────────────────────┐  │
│  │ Orchestrator             │        │ NurtureAgent             │  │
│  │ Researcher               │        │   Instant WhatsApp reply │  │
│  │ Copywriter               │        │   Qualify leads          │  │
│  │ Designer                 │        │   Follow-up sequences    │  │
│  │ Publisher                │        │   Book appointments      │  │
│  │ Analyst                  │        │                          │  │
│  └──────────────────────────┘        │ LoopAgent                │  │
│                                      │   Offline conversions    │  │
│  TRIGGERS                            │   Meta CAPI events       │  │
│  ┌──────────────────────────┐        │   Feed revenue data back │  │
│  │ Meta Lead Webhook        │        │                          │  │
│  │ WhatsApp Incoming        │        │ BookingAgent             │  │
│  │ Website Form Submit      │        │   Appointment CRUD       │  │
│  │ Cron (nurture sequences) │        │   Reminders              │  │
│  │ GHL Migration Import     │        │   No-show follow-up      │  │
│  └──────────────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────┐        ┌────────────────────────────────────┐
│    META ADS API       │        │       WHATSAPP BUSINESS API        │
│                       │        │                                    │
│ Create campaigns      │        │ Template messages (pre-approved)   │
│ Manage ad sets        │        │ 24h conversation window            │
│ Upload creatives      │        │ Media (images, video)              │
│ Conversions API       │        │ Interactive buttons                │
│ (Schedule, Purchase)  │        │ Booking confirmations              │
│ Audience insights     │        │ Follow-up sequences                │
│ Auto-pause/scale      │        │ Review requests                    │
└───────────────────────┘        └────────────────────────────────────┘
```

---

## Database Schema (New Tables)

### al_leads
The core of closed-loop marketing. Every person who shows interest.
```sql
CREATE TABLE al_leads (
  id            TEXT PRIMARY KEY,          -- ulid
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- Identity
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,             -- WhatsApp number (primary key for comms)
  email         TEXT,
  gender        TEXT,
  age_range     TEXT,                      -- from form or estimated

  -- Source Attribution (closed-loop)
  source        TEXT NOT NULL,             -- 'meta_ad', 'website_form', 'whatsapp_dm', 'ig_dm', 'walkin', 'referral'
  campaign_id   TEXT,                      -- Meta campaign ID
  ad_id         TEXT,                      -- Meta ad ID
  adset_id      TEXT,                      -- Meta ad set ID
  creative_id   TEXT,                      -- Meta creative ID
  form_id       TEXT,                      -- Instant Form ID
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  referrer_url  TEXT,

  -- Behavior (from website tracking)
  pages_viewed  JSONB DEFAULT '[]',       -- [{url, title, duration_sec, timestamp}]
  treatments_browsed JSONB DEFAULT '[]',  -- ["HIFU", "Laser", "HydraFacial"]
  time_on_site  INT DEFAULT 0,            -- total seconds
  visit_count   INT DEFAULT 1,

  -- Pipeline
  stage         TEXT DEFAULT 'new',        -- new, contacted, qualified, booked, visited, repeat, lost
  quality       TEXT,                      -- hot, warm, cold (Claude assessment)
  interest      TEXT,                      -- primary treatment interest
  notes         TEXT,

  -- Revenue (closed-loop)
  booked_treatment TEXT,
  booking_value    NUMERIC(10,2),          -- PKR
  actual_revenue   NUMERIC(10,2),          -- PKR (after visit)
  lifetime_value   NUMERIC(10,2),          -- PKR (cumulative)

  -- Meta Conversions API
  fbp           TEXT,                      -- _fbp cookie (Meta browser ID)
  fbc           TEXT,                      -- _fbc cookie (Meta click ID)
  capi_lead_sent     BOOLEAN DEFAULT false,
  capi_schedule_sent BOOLEAN DEFAULT false,
  capi_purchase_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_al_leads_phone ON al_leads(phone);
CREATE INDEX idx_al_leads_stage ON al_leads(stage);
CREATE INDEX idx_al_leads_source ON al_leads(source);
CREATE INDEX idx_al_leads_campaign ON al_leads(campaign_id);
CREATE INDEX idx_al_leads_created ON al_leads(created_at);
```

### al_clients
Graduated leads — people who've actually visited and paid.
```sql
CREATE TABLE al_clients (
  id            TEXT PRIMARY KEY,          -- ulid
  lead_id       TEXT REFERENCES al_leads(id),
  created_at    TIMESTAMPTZ DEFAULT now(),

  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  email         TEXT,
  gender        TEXT,
  date_of_birth DATE,

  -- History
  first_visit   DATE,
  last_visit    DATE,
  visit_count   INT DEFAULT 0,
  total_spent   NUMERIC(10,2) DEFAULT 0,
  treatments    JSONB DEFAULT '[]',        -- [{treatment, date, price, notes}]

  -- Preferences
  preferred_doctor  TEXT,
  skin_type         TEXT,
  allergies         TEXT,
  notes             TEXT,

  -- Retention
  next_appointment  TIMESTAMPTZ,
  last_contacted    TIMESTAMPTZ,
  nps_score         INT,                   -- 1-10
  referral_count    INT DEFAULT 0,

  -- WhatsApp
  wa_opted_in       BOOLEAN DEFAULT true,
  wa_quality        TEXT DEFAULT 'good'     -- good, warning, blocked
);

CREATE INDEX idx_al_clients_phone ON al_clients(phone);
```

### al_appointments
```sql
CREATE TABLE al_appointments (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),

  client_id     TEXT REFERENCES al_clients(id),
  lead_id       TEXT REFERENCES al_leads(id),  -- for first-timers not yet clients
  phone         TEXT NOT NULL,
  name          TEXT NOT NULL,

  treatment     TEXT NOT NULL,
  doctor        TEXT,
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  duration_min  INT DEFAULT 30,
  status        TEXT DEFAULT 'scheduled',       -- scheduled, confirmed, arrived, completed, no_show, cancelled
  source        TEXT,                           -- online, whatsapp, walkin, phone

  price         NUMERIC(10,2),
  notes         TEXT,

  -- Reminders
  reminder_24h_sent  BOOLEAN DEFAULT false,
  reminder_2h_sent   BOOLEAN DEFAULT false,
  confirmation_sent  BOOLEAN DEFAULT false
);

CREATE INDEX idx_al_appt_date ON al_appointments(date);
CREATE INDEX idx_al_appt_phone ON al_appointments(phone);
CREATE INDEX idx_al_appt_status ON al_appointments(status);
```

### al_conversations
WhatsApp message log — for context and compliance.
```sql
CREATE TABLE al_conversations (
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),

  phone         TEXT NOT NULL,
  direction     TEXT NOT NULL,             -- inbound, outbound
  message_type  TEXT NOT NULL,             -- text, template, image, video, interactive
  content       TEXT,
  template_name TEXT,                      -- if template message
  wa_message_id TEXT,                      -- WhatsApp message ID
  status        TEXT,                      -- sent, delivered, read, failed

  -- Context
  lead_id       TEXT,
  client_id     TEXT,
  agent         TEXT                       -- 'nurture', 'booking', 'manual'
);

CREATE INDEX idx_al_conv_phone ON al_conversations(phone);
CREATE INDEX idx_al_conv_created ON al_conversations(created_at);
```

### al_services
Treatment catalog — replaces GHL services. Source of truth for ads, website, booking.
```sql
CREATE TABLE al_services (
  id            TEXT PRIMARY KEY,          -- slug: 'hifu-face'
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  name          TEXT NOT NULL,             -- 'HIFU Face Lift'
  category      TEXT NOT NULL,             -- 'Skin Rejuvenation'
  description   TEXT,
  short_desc    TEXT,                      -- for ads/cards
  duration_min  INT,
  price_pkr     NUMERIC(10,2),
  price_display TEXT,                      -- 'Starting from Rs 15,000'
  active        BOOLEAN DEFAULT true,

  -- SEO
  slug          TEXT UNIQUE NOT NULL,
  meta_title    TEXT,
  meta_desc     TEXT,

  -- Marketing
  hero_image    TEXT,                      -- URL or path
  before_after  JSONB DEFAULT '[]',       -- [{before_url, after_url, caption}]
  tags          TEXT[],                    -- ['face', 'anti-aging', 'non-invasive']
  best_for      TEXT,                      -- 'Fine lines, sagging skin'
  doctor        TEXT,                      -- primary doctor for this treatment

  -- Performance (closed-loop)
  total_leads   INT DEFAULT 0,
  total_booked  INT DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0   -- leads → booked %
);

CREATE INDEX idx_al_services_category ON al_services(category);
CREATE INDEX idx_al_services_active ON al_services(active);
```

### al_campaigns
Ad campaign tracking — links to al_leads for closed-loop.
```sql
CREATE TABLE al_campaigns (
  id             TEXT PRIMARY KEY,         -- Meta campaign ID
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),

  name           TEXT NOT NULL,
  status         TEXT DEFAULT 'draft',     -- draft, pending_approval, active, paused, completed
  treatment      TEXT,                     -- target treatment
  budget_daily   NUMERIC(10,2),           -- CAD
  budget_spent   NUMERIC(10,2) DEFAULT 0,

  -- Meta IDs
  adset_id       TEXT,
  ad_id          TEXT,
  creative_id    TEXT,
  form_id        TEXT,

  -- Performance (auto-updated by Analyst)
  impressions    INT DEFAULT 0,
  clicks         INT DEFAULT 0,
  leads          INT DEFAULT 0,
  booked         INT DEFAULT 0,            -- closed-loop: actual bookings
  revenue        NUMERIC(10,2) DEFAULT 0,  -- closed-loop: actual revenue
  cpl            NUMERIC(10,2),
  cpa            NUMERIC(10,2),            -- cost per actual appointment
  roas           NUMERIC(10,2),            -- return on ad spend

  -- Content
  headline       TEXT,
  caption        TEXT,
  creative_url   TEXT,
  creative_type  TEXT                      -- image, carousel, reel
);
```

### al_staff
Dashboard access control.
```sql
CREATE TABLE al_staff (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,             -- admin, manager, receptionist, doctor
  phone         TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_login    TIMESTAMPTZ
);
```

### al_whatsapp_templates
Pre-approved templates — must be submitted to Meta and approved before use.
```sql
CREATE TABLE al_whatsapp_templates (
  id            TEXT PRIMARY KEY,          -- Meta template ID
  name          TEXT UNIQUE NOT NULL,      -- 'instant_reply', 'follow_up_day1', etc.
  category      TEXT NOT NULL,             -- MARKETING, UTILITY, AUTHENTICATION
  language      TEXT DEFAULT 'en',
  status        TEXT DEFAULT 'pending',    -- pending, approved, rejected
  body_template TEXT NOT NULL,             -- with {{1}}, {{2}} placeholders
  header_type   TEXT,                      -- text, image, video
  buttons       JSONB,                     -- [{type, text, url}]
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## WhatsApp Anti-Ban Strategy

### Rules (Non-Negotiable)
1. **Official API only** — WhatsApp Business API through Meta, never unofficial
2. **Opt-in first** — User must message first OR submit form with phone (explicit consent)
3. **24-hour window** — Free-form replies within 24h of user's last message
4. **Templates outside 24h** — Only pre-approved templates after the window closes
5. **Never bulk blast** — Every message is 1:1, personalized, relevant to their inquiry
6. **Respect stop** — If user says stop/unsubscribe, immediately mark wa_opted_in=false
7. **Quality monitoring** — Track delivery rate, read rate, block rate. If quality drops, reduce volume
8. **Rate limiting** — Max 3 template messages per lead in first 7 days. Max 1 per week after.

### Template Strategy (Submit These for Approval)
```
1. instant_reply (UTILITY)
   "Hi {{1}}! This is Aesthetic Lounge 🌟 Thank you for your interest in {{2}}.
    Dr. Huma's team will get back to you shortly. Reply here with any questions!"

2. follow_up_day1 (MARKETING)
   "Hi {{1}}, following up on your interest in {{2}} at Aesthetic Lounge.
    Here's what to expect during your first visit: {{3}}
    Ready to book? Tap below 👇"
   [Button: Book Now]

3. follow_up_day3 (MARKETING)
   "Hi {{1}}! Still thinking about {{2}}?
    Check out this transformation ✨ {{3}}
    Limited slots this week — book your consultation:"
   [Button: Book Consultation]

4. appointment_confirmation (UTILITY)
   "✅ Your appointment is confirmed!
    📋 {{1}} with {{2}}
    📅 {{3}} at {{4}}
    📍 DHA Phase 7, Lahore
    Reply to reschedule or ask questions."

5. appointment_reminder (UTILITY)
   "Hi {{1}}, reminder: your {{2}} appointment is tomorrow at {{3}}.
    📍 Aesthetic Lounge, DHA Phase 7
    Reply YES to confirm or RESCHEDULE to change."

6. post_visit (UTILITY)
   "Hi {{1}}, thank you for visiting Aesthetic Lounge! 🌟
    How was your {{2}} experience?
    Reply 1-10 and we'll take your feedback seriously."

7. review_request (MARKETING)
   "Hi {{1}}! Glad you enjoyed your visit.
    Would you mind leaving us a quick review? It helps others find us 🙏
    {{2}}"
   [Button: Leave Review]

8. seasonal_offer (MARKETING)
   "Hi {{1}}! {{2}} special at Aesthetic Lounge ✨
    {{3}}
    Limited availability — book now:"
   [Button: Book Now]
```

### Follow-Up Sequence (Automated by NurtureAgent)
```
Lead arrives
  │
  ├─ Minute 0:  instant_reply (UTILITY — no approval delay)
  │             Claude reads form answers + website behavior
  │             Qualifies: hot / warm / cold
  │
  ├─ Hour 1:   If no reply → Claude sends personalized follow-up
  │             (within 24h window, free-form)
  │
  ├─ Day 1:    follow_up_day1 template
  │             Treatment info + what to expect
  │
  ├─ Day 3:    follow_up_day3 template
  │             Before/after photo + urgency
  │
  ├─ Day 7:    If still no booking → move to cold
  │             Add to retargeting audience on Meta
  │
  └─ Monthly:  seasonal_offer template (max 1/month for cold leads)
```

---

## Closed-Loop Marketing Flow

### How Revenue Flows Back to Ads
```
Step 1: Lead clicks ad → Meta records click_id (_fbc cookie)
Step 2: Lead lands on website → Pixel fires PageView, ViewContent
Step 3: Lead submits form or WhatsApp → Pixel fires Lead
        n8n: creates al_leads row with campaign_id, ad_id, fbp, fbc
Step 4: NurtureAgent qualifies and nurtures
Step 5: Lead books appointment
        n8n: updates al_leads.stage='booked'
        n8n: fires Meta CAPI 'Schedule' event with fbc + phone hash
        Meta now knows: "this ad → this person → actually booked"
Step 6: Client visits clinic, receptionist marks 'arrived' in dashboard
        n8n: updates stage='visited', records actual_revenue
        n8n: fires Meta CAPI 'Purchase' event with value
        Meta now knows: "this ad → this person → paid Rs 15,000"
Step 7: Analyst agent (weekly):
        "HIFU campaign: 50 leads, 12 booked, 8 visited, Rs 120,000 revenue.
         CPA: Rs 62.50. ROAS: 20x. SCALE THIS.
         Botox campaign: 30 leads, 2 booked, 0 visited. PAUSE THIS."
Step 8: Meta's algorithm learns:
        "Find more people like the ones who paid Rs 15,000 for HIFU in DHA"
        Not: "Find more people who fill out forms" (which is what everyone else optimizes for)
```

### Meta Conversions API Implementation
```
Events to send (server-side from n8n, not browser):
  1. Lead       — when form submitted (dedupe with Pixel)
  2. Schedule   — when appointment booked
  3. Purchase   — when treatment completed + paid

Required data per event:
  - event_name, event_time, event_source_url
  - user_data: em (email SHA256), ph (phone SHA256), fbc, fbp
  - custom_data: currency, value (for Purchase), content_name (treatment)

Endpoint: POST https://graph.facebook.com/v21.0/{pixel_id}/events
Auth: System User Access Token (already have)
```

---

## Staff Dashboard

### Pages
```
/dashboard                    — Overview (today's appointments, new leads, active ads)
/dashboard/leads              — Lead pipeline (Kanban: new → contacted → qualified → booked → visited)
/dashboard/leads/[id]         — Lead detail (conversation history, behavior, attribution)
/dashboard/clients            — Client directory (search, filter, lifetime value)
/dashboard/clients/[id]       — Client profile (history, treatments, revenue, notes)
/dashboard/appointments       — Calendar view (day/week/month)
/dashboard/appointments/new   — Book appointment (search client, select treatment)
/dashboard/ads                — Ad campaigns (status, spend, leads, revenue, ROAS)
/dashboard/ads/create         — Create ad (Claude generates, staff approves)
/dashboard/ads/[id]           — Campaign detail (creative, metrics, leads from this ad)
/dashboard/content            — Content approval queue (pending posts/ads from pipeline)
/dashboard/conversations      — WhatsApp conversations (threaded by phone number)
/dashboard/services           — Treatment catalog CRUD (name, price, duration, photos)
/dashboard/analytics          — Performance overview (CPL, CPA, ROAS, revenue by treatment)
/dashboard/settings           — Staff management, WhatsApp config, business hours
```

### Role Permissions
| Page | Admin | Manager | Receptionist | Doctor |
|------|-------|---------|-------------|--------|
| Overview | Full | Full | View only | View only |
| Leads | Full | Full | View + Update stage | View only |
| Clients | Full | Full | View + Basic edit | Full |
| Appointments | Full | Full | Full | View own |
| Ads | Full | Full | View only | — |
| Content | Full | Approve/Reject | — | — |
| Conversations | Full | Full | View + Reply | View own |
| Services | Full | Edit | View only | View only |
| Analytics | Full | Full | — | — |
| Settings | Full | — | — | — |

---

## Website (Public)

### Pages
```
/                             — Homepage (from prototype design)
/services                     — All 11 categories (bento grid)
/services/[slug]              — Individual treatment (80+ pages for SEO)
/doctors                      — Doctor profiles
/doctors/[slug]               — Individual doctor
/about                        — Clinic story, values
/gallery                      — Before/after transformations
/contact                      — Form + map + WhatsApp
/book                         — Booking form (select treatment → date → submit)
/price-guide                  — Treatment pricing
/blog                         — SEO content
/blog/[slug]                  — Blog post
```

### Tracking (Built Into Every Page)
```javascript
// Every page load
- Meta Pixel: PageView
- Neon: page_view event (url, referrer, utm_*, fbp, fbc, timestamp)

// Treatment page
- Meta Pixel: ViewContent (content_name: treatment, content_category: category)
- Neon: update al_leads.treatments_browsed[] (if identified by fbp/phone)
- Track: scroll depth, time on page

// WhatsApp click
- Meta Pixel: Contact (content_name: treatment)
- Neon: log WhatsApp click with treatment context
- Pass: treatment name in WhatsApp pre-filled message

// Form submit
- Meta Pixel: Lead
- Meta CAPI: Lead (server-side dedupe)
- Neon: create al_leads row
- n8n webhook: trigger NurtureAgent

// Booking form
- Meta Pixel: Schedule
- Meta CAPI: Schedule (server-side)
- Neon: create al_appointments row
- n8n webhook: trigger BookingAgent (confirmation)
```

### SEO Strategy
- 80+ treatment pages = massive long-tail coverage
- Each page: unique meta title/desc, JSON-LD (MedicalProcedure schema)
- "HIFU treatment DHA Lahore" — zero competition
- "laser hair removal DHA Phase 7" — zero competition
- Blog: Claude writes 2 SEO articles/month (treatment education)
- Google Business Profile integration

---

## Google Data Integration

### Three Data Sources
```
┌──────────────────────────────────────────────────────────────────┐
│                     GOOGLE DATA LAYER                            │
│                                                                  │
│  GA4 (Behavior)          Search Console (SEO)    GBP (Local)    │
│  ┌────────────────┐     ┌─────────────────┐    ┌─────────────┐  │
│  │ Sessions        │     │ Search queries   │    │ Profile views│  │
│  │ Pages/session   │     │ Impressions      │    │ Calls        │  │
│  │ Scroll depth    │     │ Clicks           │    │ Directions   │  │
│  │ User flow       │     │ Positions        │    │ Reviews      │  │
│  │ Conversions     │     │ CTR              │    │ Photos views │  │
│  │ Demographics    │     │ Pages indexed    │    │ Q&A          │  │
│  └───────┬────────┘     └────────┬────────┘    └──────┬──────┘  │
│          │                       │                     │          │
│          └───────────────────────┼─────────────────────┘          │
│                                  │                                │
│                          n8n (nightly cron)                       │
│                                  │                                │
│                          al_analytics table                       │
│                                  │                                │
│                          Analyst Agent:                            │
│                          "HIFU gets 200 searches/mo,              │
│                           page ranks #3, 25% convert,             │
│                           Rs 15K avg revenue.                     │
│                           → Scale HIFU ads + improve              │
│                              page content for #1"                 │
└──────────────────────────────────────────────────────────────────┘
```

### GA4 Setup
- **Property**: Create for aestheticloungeofficial.com
- **Measurement ID**: Add to Next.js via `@next/third-parties/google` (or gtag)
- **Events**: PageView, ViewContent, Lead, Schedule, Contact (same as Pixel — unified tracking)
- **Data API**: `google.analytics.data.v1beta` — pull daily reports into Neon
- **Key metrics**: sessions, users, pages_per_session, avg_engagement_time, bounce_rate, conversions by treatment page

### Google Search Console
- **Verify**: DNS TXT record on awansoft.ca / aestheticloungeofficial.com
- **API**: `webmasters.v3` — pull weekly search performance
- **Feed to Researcher agent**: "These treatment keywords are trending up → create content"
- **Feed to Analyst**: "These pages have high impressions but low CTR → improve meta descriptions"
- **80+ treatment pages = 80+ keyword opportunities** tracked automatically

### Google Business Profile
- **API**: `mybusinessbusinessinformation.v1` + `mybusinessaccountmanagement.v1`
- **Pull weekly**: views, searches, calls, direction_requests, website_clicks, photo_views
- **Review monitoring**: New reviews → WhatsApp alert to admin
- **Feed to Analyst**: correlate GBP views with ad spend (are ads driving local discovery?)

### al_analytics Table
```sql
CREATE TABLE al_analytics (
  id            SERIAL PRIMARY KEY,
  date          DATE NOT NULL,
  source        TEXT NOT NULL,           -- 'ga4', 'search_console', 'gbp', 'meta_ads'
  metric        TEXT NOT NULL,           -- 'sessions', 'impressions', 'clicks', 'calls', etc.
  dimension     TEXT,                    -- treatment slug, search query, page path, campaign_id
  value         NUMERIC(12,2) NOT NULL,
  metadata      JSONB,                  -- extra context (position, ctr, device, country)
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_al_analytics_date ON al_analytics(date);
CREATE INDEX idx_al_analytics_source ON al_analytics(source, metric);
CREATE INDEX idx_al_analytics_dimension ON al_analytics(dimension);
```

### n8n Cron Jobs (Data Pull)
| Job | Schedule | Source | What |
|-----|----------|--------|------|
| GA4 Daily Pull | 6am daily | GA4 Data API | Sessions, pageviews, conversions by page |
| Search Console Weekly | Monday 7am | Search API | Queries, impressions, clicks, positions |
| GBP Weekly | Monday 7am | GBP API | Views, calls, directions, reviews |
| Meta Ads Daily | 6am daily | Marketing API | Spend, impressions, leads, CPL by campaign |

### Unified Intelligence (Analyst Agent Gets ALL Data)
```
Weekly Report to WhatsApp:

📊 AESTHETIC LOUNGE — WEEK 10 REPORT

WEBSITE (GA4):
• 1,240 sessions (+18% vs last week)
• Top pages: HIFU (320), Laser (280), HydraFacial (190)
• Avg 2.3 pages/session, 1:45 avg engagement

SEARCH (GSC):
• 3,200 impressions, 180 clicks (5.6% CTR)
• Top queries: "hifu lahore" (#2), "laser hair removal dha" (#4)
• ⚠️ "botox dha lahore" — 500 impressions but #8 position → optimize page

LOCAL (GBP):
• 890 profile views, 34 calls, 12 directions
• 2 new reviews (both 5★)

ADS (Meta):
• Spent: $68 CAD / Rs 25,400
• 42 leads, CPL Rs 605
• 11 booked (CPA Rs 2,309), 8 visited
• Revenue: Rs 120,000 — ROAS: 4.7x
• 🏆 Winner: HIFU campaign (ROAS 8.2x) — SCALE
• ⚠️ Botox campaign (0 bookings from 15 leads) — PAUSE

ACTIONS TAKEN:
• Paused Botox campaign (auto)
• Increased HIFU daily budget $8 → $12
• Created 2 new HIFU ad variants for testing
```

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Website + Dashboard | Next.js 15 (App Router) | SSG for public, SSR for dashboard |
| Styling | Tailwind CSS | Fast, consistent with prototype design |
| Database | Neon Postgres (existing) | Already have, new tables alongside existing |
| Auth | Neon Auth (or simple OTP) | Staff login, session management |
| Hosting | Netlify | Already have for FBA, consistent |
| Automation | n8n (existing) | Already running, add new agents |
| AI | Claude Sonnet 4.6 (agents) | Already in pipeline |
| Ads | Meta Marketing API | Already have access + credentials |
| Messaging | WhatsApp Business API | Already configured for AL |
| Images | fal.ai | Already integrated |
| Render | render-al-post.mjs (existing) | Playwright templates |
| Email | Resend API | Transactional (booking confirmations) |
| Monitoring | n8n + WhatsApp reports | Weekly analyst reports |

---

## GHL Migration Plan

### What Moves to Our System
| GHL Feature | Replacement | Migration |
|------------|-------------|-----------|
| Contact database | al_clients + al_leads | Export CSV → import script |
| Pipeline stages | al_leads.stage | Map GHL stages → our stages |
| Services/products | al_services | Export → seed SQL |
| Appointment booking | al_appointments + /book page | Rebuild |
| Forms | Website forms + Instant Forms | Already have |
| Email/SMS | WhatsApp (primary) + Resend (email) | WhatsApp is better for Pakistan |
| Reporting | Dashboard /analytics + Analyst agent | Better (closed-loop) |
| Automations | n8n (far more powerful) | Already building |

### Migration Steps
1. Export all GHL contacts → CSV
2. Export all GHL services → CSV
3. Import into al_clients and al_services tables
4. Verify data integrity
5. Run both systems in parallel for 2 weeks
6. Cut over — cancel GHL subscription

### What We Keep From GHL (Temporarily)
- Nothing. Clean break. GHL charges monthly, our system is self-hosted + free.

---

## Build Phases

### Phase 0: Dev Environment (Day 1)
- [ ] Create Neon dev branch (isolated from prod)
- [ ] Initialize Next.js 15 project in ~/Documents/aesthetic-lounge/
- [ ] Set up Tailwind with AL brand colors/fonts
- [ ] Create .env with all API keys
- [ ] Set up Netlify site (dev subdomain: dev.aestheticloungeofficial.com)
- [ ] Run all new table migrations on dev branch

### Phase 1: Website + Tracking (Week 1-2)
- [ ] Convert prototype → Next.js components
- [ ] Build all public pages (home, services, doctors, about, contact, book, gallery, price-guide)
- [ ] Generate 80+ treatment pages from al_services data
- [ ] Meta Pixel integration (PageView, ViewContent, Lead, Schedule, Contact)
- [ ] Meta Conversions API (server-side Lead, Schedule events via Netlify Functions)
- [ ] UTM capture → cookie → form submission
- [ ] WhatsApp click tracking (pre-filled message with treatment name)
- [ ] JSON-LD structured data (MedicalBusiness, MedicalProcedure, Physician)
- [ ] Responsive, fast, Core Web Vitals optimized
- [ ] Deploy to dev.aestheticloungeofficial.com

### Phase 2: Database + Lead Pipeline (Week 2-3)
- [ ] Create all new tables (al_leads, al_clients, al_appointments, al_conversations, al_services, al_campaigns, al_staff, al_whatsapp_templates)
- [ ] GHL data migration (contacts → al_clients, services → al_services)
- [ ] Website form → Netlify Function → al_leads insert + n8n webhook
- [ ] Meta Lead webhook → n8n → al_leads insert
- [ ] NurtureAgent in n8n (instant reply, qualify, follow-up sequence)
- [ ] WhatsApp template submission to Meta (8 templates)
- [ ] Conversation logging (al_conversations)

### Phase 3: Staff Dashboard (Week 3-4)
- [ ] Auth (staff login, role-based access)
- [ ] Lead pipeline view (Kanban board)
- [ ] Client directory + profile pages
- [ ] Appointment calendar (day/week/month)
- [ ] WhatsApp conversation view
- [ ] Service catalog CRUD
- [ ] Content approval queue

### Phase 4: Closed-Loop + Ads + Google Integration (Week 4-5)
- [ ] Meta CAPI: Schedule event when appointment booked
- [ ] Meta CAPI: Purchase event when visit completed (receptionist marks in dashboard)
- [ ] Ad campaign view (create, monitor, pause)
- [ ] Claude ad creation flow (staff clicks "Create Ad" → Claude generates → approve → publish)
- [ ] Connect AL n8n ad pipeline to dashboard
- [ ] GA4 property setup + gtag on website
- [ ] GA4 Data API daily pull → al_analytics (n8n cron)
- [ ] Google Search Console verification + API weekly pull → al_analytics
- [ ] Google Business Profile API weekly pull → al_analytics
- [ ] Meta Ads API daily pull → al_analytics
- [ ] Analyst agent upgrade: unified reporting (GA4 + GSC + GBP + Meta + Revenue)
- [ ] Auto-pause losing campaigns, scale winners
- [ ] Dashboard /analytics page: unified view across all sources

### Phase 5: Booking + Retention (Week 5-6)
- [ ] BookingAgent in n8n (appointment CRUD, confirmations)
- [ ] Automated reminders (24h + 2h before appointment)
- [ ] No-show follow-up (WhatsApp: "We missed you, would you like to reschedule?")
- [ ] Post-visit feedback (NPS score)
- [ ] Review request automation
- [ ] Referral tracking
- [ ] Repeat visit offers (personalized based on treatment history)

### Phase 6: Launch (Week 6-7)
- [ ] Parallel run: old site + new site (2 weeks)
- [ ] GHL export → import verification
- [ ] DNS cutover: aestheticloungeofficial.com → Netlify
- [ ] Cancel GHL subscription
- [ ] Staff training (WhatsApp walkthrough of dashboard)
- [ ] Monitor WhatsApp quality rating first 2 weeks

---

## Cost Comparison

### Current (GHL + Manual)
| Item | Monthly Cost |
|------|-------------|
| GoHighLevel | ~$97-297 USD |
| Employee time (manual lead follow-up) | Hours wasted |
| Missed leads (slow response) | Revenue lost |
| No closed-loop (optimizing for leads not revenue) | Ad waste |

### New System
| Item | Monthly Cost |
|------|-------------|
| Neon Postgres | Free (existing) |
| Netlify | Free tier (existing) |
| n8n | Self-hosted (existing) |
| Claude API | ~$20-50 (existing budget) |
| WhatsApp Business API | Free (Meta-hosted, conversation-based pricing ~$0.01-0.08/conversation) |
| Meta Ads | $300 CAD/month (unchanged) |
| **Total new cost** | **~$0 additional** (everything already paid for) |

---

## Success Metrics (After 90 Days)

| Metric | Current | Target |
|--------|---------|--------|
| Lead response time | Hours (manual) | < 2 minutes (automated) |
| Lead → Booking rate | Unknown | 25%+ (tracked) |
| Cost per booking (CPA) | Unknown | Tracked, optimized |
| ROAS | Unknown | 5x+ |
| Website treatment pages | 1 (homepage) | 80+ (SEO) |
| Monthly organic leads (SEO) | ~0 | 50+ (within 6 months) |
| Client retention rate | Unknown | Tracked, 40%+ repeat |
| Employee hours on leads | Many | Near zero |
| GHL cost | $97-297/month | $0 |
