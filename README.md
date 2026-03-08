# Jamii — Offline-First AI Host Manager

An intelligent host management app for short-term rentals in emerging markets. Built for the [PowerSync AI Hackathon](https://www.powersync.com/blog/powersync-ai-hackathon-8k-in-prizes) (March 2026).

## The Problem

Short-term rental hosts in emerging markets face unreliable internet connectivity, making it impossible to use cloud-dependent management tools. Guest messages go unanswered, pricing decisions are made without data, and returning guests aren't recognized.

## The Solution

Jamii works fully offline via local SQLite, syncs through PowerSync when connectivity returns, and uses an AI agent (Mastra) to handle guest communication, dynamic pricing, and operational memory.

## Architecture

```
┌──────────────────────────────────────────────┐
│  React Frontend (Vite + TypeScript)          │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Dashboard │  │ Bookings  │  │ AI Agent  │ │
│  └─────┬────┘  └─────┬─────┘  └─────┬─────┘ │
│        │              │              │        │
│  ┌─────┴──────────────┴──────────────┴─────┐ │
│  │        PowerSync React SDK              │ │
│  │     (useQuery, useStatus, streams)      │ │
│  └─────────────────┬───────────────────────┘ │
│                    │                          │
│  ┌─────────────────┴───────────────────────┐ │
│  │         Local SQLite (WASM)             │ │
│  │   Offline reads + writes + queued sync  │ │
│  └─────────────────┬───────────────────────┘ │
└────────────────────┼─────────────────────────┘
                     │ Sync Streams
┌────────────────────┼─────────────────────────┐
│  PowerSync Service │                          │
│  (Sync Streams, edition 3)                    │
└────────────────────┼─────────────────────────┘
                     │ Replication
┌────────────────────┼─────────────────────────┐
│  Supabase (Postgres + Auth + RLS)            │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │Properties│  │ Bookings │  │Agent Memory│ │
│  └──────────┘  └──────────┘  └────────────┘ │
└──────────────────────────────────────────────┘
```

**AI Layer:** Mastra agent with working memory for guest profiles, pricing tools, and availability checks. Uses Claude (Anthropic) as the LLM.

## Key Features

- **Offline-first**: Full CRUD on local SQLite — check bookings, draft messages, update tasks without internet
- **Sync Streams**: On-demand data subscriptions — only sync what you need, when you need it
- **AI Agent**: Guest response generation, dynamic pricing, returning guest recognition
- **Agent Memory**: Learns guest preferences across stays, builds operational knowledge

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Sync | PowerSync (Sync Streams) |
| Backend | Supabase (Postgres + Auth) |
| AI Agent | Mastra + Claude (Anthropic) |
| Local DB | SQLite (WASM via PowerSync) |
| Styling | Tailwind CSS |

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, PowerSync URL, and Anthropic API key

# Run database migration on Supabase
# (paste supabase/migrations/001_init.sql in Supabase SQL editor)

# Seed test data
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed.ts

# Start dev server
npm run dev
```

## Real-World Anchor

Built around Seventh Haven at Leo Residences, Lavington, Nairobi — a real Airbnb property. Synthetic data seeded from actual Lavington market rates (KES 7,500-12,000/night).

## Prize Categories

- **Core**: Best overall project
- **Local-First**: Best offline-first implementation
- **Mastra**: Best Mastra AI agent integration
- **Supabase**: Best Supabase backend usage

## License

MIT
