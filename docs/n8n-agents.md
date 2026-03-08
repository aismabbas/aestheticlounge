# AL Pipeline — NurtureAgent, BookingAgent & Meta Lead Receiver

Three n8n workflow additions to the Aesthetic Lounge marketing pipeline for automated lead nurturing, booking management, and Meta Lead Form ingestion.

## Workflow Files

| File | Purpose |
|------|---------|
| `~/.config/al-agent/workflows/al-nurture-agent.json` | Lead classification + WhatsApp nurture sequences |
| `~/.config/al-agent/workflows/al-booking-agent.json` | Appointment confirmation, reminders, no-show handling |
| `~/.config/al-agent/workflows/al-meta-lead-receiver.json` | Receives Meta Lead Form submissions, inserts into DB, triggers NurtureAgent |

## Import Instructions

Import each workflow via the n8n API:

```bash
# NurtureAgent
curl -X POST https://webhook.awansoft.ca/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @~/.config/al-agent/workflows/al-nurture-agent.json

# BookingAgent
curl -X POST https://webhook.awansoft.ca/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @~/.config/al-agent/workflows/al-booking-agent.json

# Meta Lead Receiver
curl -X POST https://webhook.awansoft.ca/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @~/.config/al-agent/workflows/al-meta-lead-receiver.json
```

After import, activate each workflow via the n8n UI or API.

## Required n8n Credentials

| Credential Name | Type | Used By | Notes |
|-----------------|------|---------|-------|
| `Anthropic (AL)` | Anthropic API | ClassifyLead (NurtureAgent) | Sonnet 4.6 for lead classification |
| `WhatsApp Bearer (AL)` | HTTP Header Auth | SendWhatsApp, SendFollowUp, SendConfirmation, SendReminder, SendNoShowFollowUp | Header: `Authorization`, Value: `Bearer <SYSTEM_USER_ACCESS_TOKEN>` |
| `Meta CAPI (AL)` | HTTP Header Auth | TriggerCAPI, FireCAPISchedule | For Conversions API events |

### Required n8n Environment Variables

Set these in n8n Settings > Variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `AL_WA_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID | WhatsApp API endpoint |
| `AL_META_PIXEL_ID` | Meta Pixel ID | CAPI events |
| `AL_META_ACCESS_TOKEN` | System User Access Token | CAPI authentication |

## Webhook URLs

| Webhook | URL | Method | Source |
|---------|-----|--------|--------|
| NurtureAgent — new lead | `https://webhook.awansoft.ca/webhook/al-new-lead` | POST | Website form, Meta Lead Receiver |
| NurtureAgent — test | `https://webhook.awansoft.ca/webhook-test/al-new-lead` | POST | Testing only |
| BookingAgent — new booking | `https://webhook.awansoft.ca/webhook/al-new-booking` | POST | Website booking form |
| BookingAgent — test | `https://webhook.awansoft.ca/webhook-test/al-new-booking` | POST | Testing only |
| Meta Lead Receiver | `https://webhook.awansoft.ca/webhook/al-meta-lead` | POST | Meta Lead Form webhook |
| Meta Lead Receiver — test | `https://webhook.awansoft.ca/webhook-test/al-meta-lead` | POST | Testing only |

### Meta Lead Form Webhook Setup

1. Go to Meta Business Manager > App > Webhooks
2. Subscribe to `leadgen` events on the Page (`470913939437743`)
3. Set callback URL: `https://webhook.awansoft.ca/webhook/al-meta-lead`
4. Set verify token: `al-webhook-verify-2026` (matches whatsapp-config.json)

## WhatsApp Message Templates

These templates must be created and approved in WhatsApp Business Manager before the workflows can send them.

| Template Name | Used By | Variables | Purpose |
|---------------|---------|-----------|---------|
| `al_follow_up` | NurtureAgent (SendFollowUp) | `{{1}}` = name, `{{2}}` = treatment interest | 24h follow-up for unresponsive leads |
| `al_booking_confirmation` | BookingAgent (SendConfirmation) | `{{1}}` = name, `{{2}}` = treatment, `{{3}}` = date, `{{4}}` = time | Booking confirmation |
| `al_appointment_reminder` | BookingAgent (SendReminder) | `{{1}}` = name, `{{2}}` = treatment, `{{3}}` = date, `{{4}}` = time | 24h appointment reminder |
| `al_missed_appointment` | BookingAgent (SendNoShowFollowUp) | `{{1}}` = name, `{{2}}` = treatment | "We missed you" re-engagement |

### Suggested Template Content

**al_follow_up:**
> Hi {{1}}, this is Aesthetic Lounge. We wanted to follow up about {{2}}. Dr. Huma and our team are here to help you achieve your best results. Would you like to book a consultation?

**al_booking_confirmation:**
> Hi {{1}}, your appointment for {{2}} is confirmed for {{3}} at {{4}}. Aesthetic Lounge, DHA Phase 7, Lahore. Please arrive 10 minutes early. See you soon!

**al_appointment_reminder:**
> Hi {{1}}, a friendly reminder about your {{2}} appointment tomorrow, {{3}} at {{4}}. Dr. Huma and the team look forward to seeing you! Reply if you need to reschedule.

**al_missed_appointment:**
> Hi {{1}}, we missed you at your {{2}} appointment. We understand things come up! Dr. Huma would love to reschedule at your convenience. Just reply to book a new time.

## Database Tables Required

These tables must exist in the Neon `neondb` database before running the workflows.

```sql
-- Leads table
CREATE TABLE IF NOT EXISTS al_leads (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  treatment_interest TEXT,
  source TEXT DEFAULT 'website',
  ad_id TEXT,
  campaign_id TEXT,
  form_id TEXT,
  stage TEXT DEFAULT 'new',        -- new, contacted, qualified, booked, no_show, completed
  quality TEXT DEFAULT 'unknown',   -- hot, warm, cold, unknown
  follow_up_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS al_conversations (
  id SERIAL PRIMARY KEY,
  lead_phone TEXT NOT NULL,
  direction TEXT NOT NULL,          -- inbound, outbound
  message TEXT,
  message_type TEXT,                -- nurture, follow_up, booking_confirmation, reminder
  agent TEXT,                       -- NurtureAgent, BookingAgent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS al_appointments (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  treatment TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT,
  status TEXT DEFAULT 'scheduled',  -- scheduled, completed, cancelled, no_show
  source TEXT DEFAULT 'website',
  reminder_24h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_al_leads_phone ON al_leads(phone);
CREATE INDEX IF NOT EXISTS idx_al_leads_stage ON al_leads(stage);
CREATE INDEX IF NOT EXISTS idx_al_conversations_phone ON al_conversations(lead_phone);
CREATE INDEX IF NOT EXISTS idx_al_appointments_date ON al_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_al_appointments_status ON al_appointments(status);
```

## Testing Instructions

### 1. Create database tables

Run the SQL above against the Neon database using the HTTP SQL API or psql.

### 2. Test NurtureAgent — new lead

```bash
curl -X POST https://webhook.awansoft.ca/webhook-test/al-new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "+923001234567",
    "email": "test@example.com",
    "treatment_interest": "HydraFacial",
    "source": "website"
  }'
```

Expected: Lead inserted into `al_leads`, classified by AI, WhatsApp message sent, conversation logged, CAPI event fired.

### 3. Test BookingAgent — new booking

```bash
curl -X POST https://webhook.awansoft.ca/webhook-test/al-new-booking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "+923001234567",
    "treatment": "Laser Hair Removal",
    "appointment_date": "2026-03-15",
    "appointment_time": "2:00 PM",
    "source": "website"
  }'
```

Expected: Appointment inserted into `al_appointments`, WhatsApp confirmation sent, CAPI Schedule event fired.

### 4. Test Meta Lead Receiver

```bash
curl -X POST https://webhook.awansoft.ca/webhook-test/al-meta-lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meta Test Lead",
    "phone": "03211234567",
    "email": "meta@test.com",
    "treatment_interest": "Skin Rejuvenation",
    "ad_id": "123456",
    "campaign_id": "789012"
  }'
```

Expected: Lead inserted into `al_leads` with `source='meta_ad'`, then NurtureAgent triggered via internal webhook.

### 5. Verify cron paths

- NurtureAgent cron (every 4h): Checks for leads with `stage IN ('new','contacted')` not updated in 24h, sends follow-up template
- BookingAgent cron (every 1h): Checks for tomorrow's appointments needing reminders; checks for past appointments still `scheduled` and marks as no-show

### 6. Verify in database

```bash
# Check leads
curl -X POST "https://ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/sql" \
  -H "Content-Type: application/json" \
  -H "Neon-Connection-String: postgresql://neondb_owner:npg_K2DArftcHS5I@ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  -d '{"query": "SELECT * FROM al_leads ORDER BY created_at DESC LIMIT 5"}'

# Check conversations
curl -X POST "https://ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/sql" \
  -H "Content-Type: application/json" \
  -H "Neon-Connection-String: postgresql://neondb_owner:npg_K2DArftcHS5I@ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  -d '{"query": "SELECT * FROM al_conversations ORDER BY created_at DESC LIMIT 5"}'

# Check appointments
curl -X POST "https://ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/sql" \
  -H "Content-Type: application/json" \
  -H "Neon-Connection-String: postgresql://neondb_owner:npg_K2DArftcHS5I@ep-dry-grass-ajm6d74h-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  -d '{"query": "SELECT * FROM al_appointments ORDER BY created_at DESC LIMIT 5"}'
```

## Architecture Flow

```
                    ┌─────────────────────────────────────────────┐
                    │            META LEAD RECEIVER               │
                    │                                             │
 Meta Lead Form ──► │ MetaLeadWebhook → ParseMetaLead → InsertLead│──► TriggerNurture ─┐
                    └─────────────────────────────────────────────┘                     │
                                                                                       ▼
                    ┌──────────────────────────────────────────────────────────────────────┐
                    │                       NURTURE AGENT                                  │
                    │                                                                      │
 Website Form ────► │ AlLeadWebhook → LoadLeadData → ClassifyLead → UpdateLeadStage       │
                    │                                  (Sonnet 4.6)   → SendWhatsApp       │
                    │                                                   → LogConversation  │
                    │                                                   → TriggerCAPI      │
                    │                                                                      │
 Every 4 hours ──► │ AlNurtureCron → CheckFollowUps → SendFollowUp → LogFollowUp          │
                    └──────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────────────────────────────────────┐
                    │                       BOOKING AGENT                                  │
                    │                                                                      │
 Booking Form ───► │ AlBookingWebhook → ProcessBooking → SendConfirmation                 │
                    │                                     → LogBookingConversation          │
                    │                                     → FireCAPISchedule                │
                    │                                                                      │
 Every 1 hour ──► │ AlReminderCron → CheckReminders ──┬─► SendReminder → UpdateReminderSent│
                    │                                  └─► CheckNoShows → MarkNoShow       │
                    │                                                    → SendNoShowFollowUp│
                    └──────────────────────────────────────────────────────────────────────┘
```
