-- Jamii Host Manager — Initial Schema
-- Supabase Postgres + RLS + PowerSync replication

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  amenities TEXT,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  total_price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (guest communication)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  sent BOOLEAN DEFAULT FALSE,
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (cleaning, maintenance, turnover)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ
);

-- Pricing history
CREATE TABLE pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  suggested_price NUMERIC(10, 2),
  actual_price NUMERIC(10, 2),
  source TEXT,
  competitor_avg NUMERIC(10, 2)
);

-- Agent memory (guest profiles, learned preferences)
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence NUMERIC(3, 2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_tasks_property ON tasks(property_id);
CREATE INDEX idx_pricing_property_date ON pricing_history(property_id, date);
CREATE INDEX idx_memories_guest ON agent_memories(guest_email);

-- Row-Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

-- Policies: host sees only their own data
CREATE POLICY "hosts_own_properties" ON properties
  FOR ALL USING (host_id = auth.uid());

CREATE POLICY "hosts_see_bookings" ON bookings
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
  );

CREATE POLICY "hosts_see_messages" ON messages
  FOR ALL USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE p.host_id = auth.uid()
    )
  );

CREATE POLICY "hosts_see_tasks" ON tasks
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
  );

CREATE POLICY "hosts_see_pricing" ON pricing_history
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
  );

CREATE POLICY "hosts_see_memories" ON agent_memories
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
  );

-- PowerSync replication publication (REQUIRED)
CREATE PUBLICATION powersync FOR TABLE
  properties,
  bookings,
  messages,
  tasks,
  pricing_history,
  agent_memories;
