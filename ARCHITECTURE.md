# Jamii — Architecture Summary

**Offline-First AI Host Manager for Short-Term Rentals in Emerging Markets**

Live: [jamii.thexi.dev](https://jamii.thexi.dev)

---

## Problem

Short-term rental hosts in emerging markets (Kenya, Nigeria, South Africa) manage properties with unreliable internet. They need to access bookings, guest history, and pricing data offline — and they need an AI assistant that learns guest preferences over time to provide personalized, context-aware hospitality.

## Solution

Jamii is a PWA that syncs all property data to a local SQLite database via PowerSync, so hosts can manage their entire portfolio offline. An AI agent ("the Hive Mind") learns from every guest interaction and stores memories that are synced across devices and persist across sessions.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Jamii PWA (React + Vite)         │
│                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Hive         │  │ Property     │  │ BeeChat  │ │
│  │ Dashboard    │  │ Detail       │  │ (AI)     │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
│         │                │               │        │
│         └────────┬───────┘               │        │
│                  │                       │        │
│         ┌───────▼────────┐     ┌────────▼──────┐ │
│         │  PowerSync      │     │  Mastra Agent │ │
│         │  Local SQLite   │     │  (AI Tools)   │ │
│         └───────┬────────┘     └────────┬──────┘ │
└─────────────────┼──────────────────────┼─────────┘
                  │ Sync Streams          │ HTTPS
                  │                       │
         ┌───────▼────────┐     ┌────────▼──────┐
         │  PowerSync      │     │  Mastra       │
         │  Cloud Service  │     │  Dev Server   │
         └───────┬────────┘     └───────────────┘
                 │
         ┌───────▼────────┐
         │  Supabase       │
         │  (Postgres +    │
         │   Auth + RLS)   │
         └─────────────────┘
```

---

## PowerSync Usage (Sync Streams)

PowerSync is the backbone of Jamii's offline-first architecture. All data lives in a local SQLite database on the user's device and syncs bidirectionally with Supabase Postgres via Sync Streams.

### Sync Streams Configuration (9 streams)

| Stream | Type | Purpose |
|--------|------|---------|
| `my_properties` | Auto-subscribe | Host's properties load on connect |
| `my_bookings` | Auto-subscribe | All bookings across host's properties |
| `my_tasks` | Auto-subscribe | Action queue — cleaning, maintenance, turnover |
| `my_pricing` | Auto-subscribe | Pricing history for calibration dashboard |
| `guest_memories` | Auto-subscribe | AI-learned guest preferences (Hive Memory) |
| `property_bookings` | Parameterized | Bookings for a specific property |
| `booking_messages` | Parameterized | Guest messaging thread for a booking |
| `property_tasks` | Parameterized | Tasks filtered by property |
| `property_pricing` | Parameterized | Pricing data for a specific property |

### Why PowerSync Matters Here

1. **Offline reads**: Hosts view all bookings, guest preferences, pricing, and tasks from local SQLite — no network required. In Nairobi, connectivity drops are frequent; the app keeps working.

2. **Bidirectional sync**: When the host sends a message, creates a task, or accepts a pricing suggestion offline, the write is queued locally and synced when connectivity returns.

3. **AI memory persistence**: The `agent_memories` table stores what the Hive Mind learns about guests (preferences, return visit count, feedback). These memories sync across devices — a host can learn something on their laptop and see it on their phone.

4. **Sync Streams for security**: Each stream is scoped to `auth.user_id()`, so hosts only see their own properties and data. Parameterized streams allow lazy loading of detail views without over-fetching.

---

## Schema (6 tables, all synced via PowerSync)

| Table | Key Fields | Role |
|-------|-----------|------|
| `properties` | name, address, amenities, host_id | Property portfolio |
| `bookings` | property_id, guest_name, check_in/out, status, guest_return_count | Booking management |
| `messages` | booking_id, content, ai_generated, sent, synced | Guest messaging with AI drafts |
| `tasks` | property_id, type, description, status, due_date | Action queue (cleaning, maintenance) |
| `pricing_history` | property_id, date, suggested/actual/competitor_avg | Pricing calibration |
| `agent_memories` | guest_email, memory_type, content, confidence, decay_lambda, times_validated | Hive Memory — AI-learned guest intelligence |

---

## AI Agent (Mastra)

The Jamii Host Agent is built with Mastra and powered by Claude (Anthropic). It has 7 tools that read from and write to the same Supabase Postgres database that PowerSync syncs from:

| Tool | Function |
|------|----------|
| `check-pricing` | Suggest dynamic pricing based on season, demand, competitor data |
| `fetch-guest-history` | Retrieve guest preferences and past stay memories |
| `check-availability` | Query open dates across properties |
| `create-task` | Create cleaning, turnover, or maintenance tasks |
| `update-pricing` | Record pricing suggestions to history |
| `draft-message` | Draft personalized guest messages for host review |
| `learn-memory` | Store new guest preferences with confidence scoring and decay |

### Hive Memory Protocol

The agent doesn't just respond — it **learns**. Each guest interaction can create or validate a memory in `agent_memories`. Memories have:
- **Confidence score** (0-1): How certain the memory is
- **Decay lambda**: Memories fade over time unless validated
- **Times validated**: Repeated observations strengthen memories
- **Source tracking**: Where the memory came from (conversation, review, booking notes)

This creates a growing intelligence layer that makes the host more effective over time.

---

## Supabase

- **Auth**: Email/password authentication with Supabase Auth. Demo account for frictionless onboarding.
- **Postgres**: All 6 tables with Row Level Security (RLS) scoped to `auth.uid()`.
- **Session persistence**: `persistSession: true` enables offline session caching. The app preserves cached sessions when offline token refresh fails.

---

## Offline-First Design

### Service Worker (stale-while-revalidate + cache-first)
- **Navigation**: Cached `index.html` served immediately (SPA routing)
- **WASM**: Cache-first strategy for PowerSync SQLite WASM files (1-2.5 MB, content-hashed, immutable)
- **Assets**: Stale-while-revalidate for JS/CSS bundles — instant load, background refresh
- **Offline fallback**: Branded HTML page when no cache exists

### Auth Resilience
- When offline, expired Supabase JWT refresh failures are ignored — the cached session is preserved
- PowerSync's local SQLite database remains queryable even when auth drops
- Auto-refresh on reconnect restores full sync

### PWA
- Installable with `manifest.json` (standalone mode)
- Service worker pre-caches app shell on install
- Works on mobile browsers across Kenya, Nigeria, South Africa

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| Local DB | PowerSync Web SDK (SQLite via WASM) |
| Sync | PowerSync Sync Streams |
| Backend DB | Supabase (Postgres + Auth + RLS) |
| AI Agent | Mastra + Claude (Anthropic) |
| AI Memory | LibSQL (Mastra memory) + Supabase (synced memories) |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub Actions → Cloudflare Pages |

---

## Bonus Category Qualifications

### Best Local-First Submission
Jamii is designed ground-up for offline-first operation. All data syncs to local SQLite. The service worker caches all assets. Auth resilience preserves sessions offline. The entire app is usable without any network connection after first load.

### Best Supabase Submission
Supabase powers auth (with demo account), Postgres with RLS for all 6 tables, and serves as the backend for PowerSync sync. The AI agent's tools read from and write to Supabase directly.

### Best Mastra Submission
The Jamii Host Agent is built entirely with Mastra — 7 custom tools, Claude as the LLM, LibSQL for agent memory, and the Mastra dev server for the BeeChat interface. The agent learns from conversations via the Hive Memory protocol.
