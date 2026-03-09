# Jamii — Offline-First AI Host Manager

An intelligent host management app for short-term rentals in Nairobi, Kenya. Built for the [PowerSync AI Hackathon](https://powersync-ai-hackathon.devpost.com/) (March 2026).

## The Problem

Short-term rental hosts in emerging markets face unreliable internet connectivity, making cloud-dependent management tools unusable. Guest messages go unanswered, pricing decisions are made without data, and returning guests aren't recognized.

## The Solution

Jamii works fully offline via local SQLite, syncs through PowerSync when connectivity returns, and uses an AI agent (Mastra + Claude) for dynamic pricing, guest history recall, and availability checking.

**Real use case**: Managing "Seventh Haven" at Leo Residences in Lavington, Nairobi, and two other properties across the city.

## Architecture

```
+------------------+     +------------------+     +------------------+
|   React + Vite   |     |   PowerSync      |     |   Supabase       |
|   (Frontend)     |<--->|   (Sync Engine)  |<--->|   (Postgres +    |
|                  |     |   Local SQLite   |     |    Auth + RLS)   |
+------------------+     +------------------+     +------------------+
                                                         ^
+------------------+                                     |
|   Mastra Agent   |-------------------------------------+
|   (AI Backend)   |  Supabase service key (server-side)
|   Claude Sonnet  |
+------------------+
```

**Offline-first**: All reads and writes go to a local SQLite database via PowerSync. Changes sync bidirectionally to Supabase Postgres when connectivity is available. The app works fully offline — add bookings, complete tasks, send messages — and syncs automatically when back online.

**AI Agent**: A Mastra agent with 3 tools queries Supabase server-side for:
- **Dynamic pricing** — Historical rates, competitor averages, occupancy-based demand signals
- **Guest history** — Past bookings, preferences, and agent memories for returning guests
- **Availability** — Date conflict detection and upcoming check-in/check-out schedules

## Features

- **Dashboard** — Properties overview with revenue metrics, active bookings, pending tasks
- **Property management** — Add, edit properties with amenities tags
- **Booking management** — Create bookings, update status (confirmed/checked-in/completed/cancelled)
- **Guest messaging** — Threaded message view per booking with AI-drafted responses
- **Task management** — Create tasks (cleaning, maintenance, turnover, supplies), mark complete
- **AI agent chat** — Ask about pricing, guest history, availability; property-aware context
- **Pricing history** — Track suggested vs actual prices, competitor averages
- **Sync status** — Real-time online/offline/connecting indicator with error display
- **Offline mode** — Full CRUD works without internet, syncs when connectivity returns

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Sync | PowerSync (edition 3 sync streams) |
| Database | Supabase (Postgres + Row Level Security) |
| Auth | Supabase Auth (email/password) |
| AI | Mastra v1 + Claude Sonnet 4 via Anthropic API |
| Local DB | SQLite (via PowerSync `@powersync/web`) |

## Setup

### Prerequisites

- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))
- PowerSync instance ([powersync.com](https://powersync.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
VITE_MASTRA_URL=http://localhost:4111
```

### 3. Run database migration

Apply the schema to your Supabase project (via SQL editor or CLI):

```bash
cat supabase/migrations/001_init.sql
```

### 4. Deploy sync rules

Upload `sync-streams.yaml` to your PowerSync dashboard. Configure:
- **JWKS URI**: `https://your-project.supabase.co/auth/v1/.well-known/jwks.json`
- **JWT Audience**: `authenticated`

### 5. Seed demo data

```bash
npx tsx --env-file=.env scripts/seed.ts
```

Creates 3 properties, 11 bookings, 8 tasks, 42 pricing history entries, and 7 agent memories.

### 6. Start the app

```bash
# Terminal 1: Vite dev server
npm run dev

# Terminal 2: Mastra agent server
npx mastra dev --dir ./mastra --env .env
```

### 7. Login

Open http://localhost:5173 and sign in:
- Email: `host@jamii.app`
- Password: `jamii-demo-2026`

## PowerSync Usage

Jamii uses PowerSync edition 3 sync streams with parameterized subscriptions:

- `my_properties` — Auto-subscribed, filtered by `auth.user_id()`
- `property_bookings` — Subscribed per property via `subscription.parameter('property_id')`
- `booking_messages` — Subscribed per booking
- `property_tasks` — Subscribed per property
- `property_pricing` — Subscribed per property
- `guest_memories` — Auto-subscribed for all host-owned properties

All UI queries run against the local SQLite database. Dashboard metrics, booking lists, task counts, revenue calculations, and pricing history are all computed locally, demonstrating true offline-first capability.

## Project Structure

```
jamii-host-manager/
  mastra/
    agents/host-agent.ts       # AI agent + system prompt
    tools/
      pricing-tool.ts          # Dynamic pricing (Supabase queries)
      guest-history-tool.ts    # Guest memory + booking history
      calendar-tool.ts         # Availability checking
    index.ts                   # Mastra instance
  src/
    components/
      BookingCard.tsx           # Booking summary card
      Layout.tsx                # App shell + nav + sync status
      MessageBubble.tsx         # Chat message display
      SyncStatus.tsx            # Online/offline indicator
    lib/
      auth/AuthContext.tsx       # Supabase auth provider
      powersync/
        db.ts                   # PowerSync database instance
        schema.ts               # Local SQLite schema
        PowerSyncProvider.tsx    # PowerSync connection + logging
        SupabaseConnector.ts     # PowerSync <-> Supabase bridge
      format.ts                 # Date + currency formatters (KES)
      supabase.ts               # Supabase client
    pages/
      Dashboard.tsx             # Properties + metrics + bookings
      PropertyDetail.tsx        # Property view/edit + bookings + tasks + pricing
      BookingDetail.tsx         # Booking view + messages + status
      AddProperty.tsx           # New property form
      AgentChat.tsx             # AI agent conversation
      Login.tsx                 # Auth screen
  scripts/seed.ts               # Demo data seeder
  supabase/migrations/          # Database schema + RLS policies
  sync-streams.yaml             # PowerSync sync rules
```

## Prize Categories

- **Core** — Best overall project
- **Best Local-First** — Best offline-first implementation
- **Best Supabase** — Best Supabase backend usage
- **Best Mastra** — Best Mastra AI agent integration

## License

MIT
