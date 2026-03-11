-- Jamii Hive Memory — Intelligence Layer
-- Adds decay, calibration, and proactive intelligence fields

-- Agent memories: add Hive intelligence fields
ALTER TABLE agent_memories
  ADD COLUMN IF NOT EXISTS decay_lambda NUMERIC(5, 3) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS last_validated TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS times_validated INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'agent';

-- Pricing history: add accuracy tracking
ALTER TABLE pricing_history
  ADD COLUMN IF NOT EXISTS accuracy_score NUMERIC(5, 3),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Bookings: add guest_return_count for quick lookup
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_return_count INTEGER DEFAULT 0;

-- Index for Hive Dashboard queries
CREATE INDEX IF NOT EXISTS idx_memories_confidence ON agent_memories(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_memories_last_validated ON agent_memories(last_validated);
CREATE INDEX IF NOT EXISTS idx_pricing_accuracy ON pricing_history(accuracy_score) WHERE accuracy_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_checkin ON bookings(check_in);
