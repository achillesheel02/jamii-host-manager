import { column, Schema, TableV2 } from "@powersync/web";

const properties = new TableV2({
  name: column.text,
  address: column.text,
  description: column.text,
  amenities: column.text,
  host_id: column.text,
  created_at: column.text,
});

const bookings = new TableV2(
  {
    property_id: column.text,
    guest_name: column.text,
    guest_email: column.text,
    guest_phone: column.text,
    check_in: column.text,
    check_out: column.text,
    status: column.text,
    total_price: column.real,
    notes: column.text,
    created_at: column.text,
  },
  { indexes: { property: ["property_id"] } },
);

const messages = new TableV2(
  {
    booking_id: column.text,
    sender: column.text,
    content: column.text,
    ai_generated: column.integer,
    sent: column.integer,
    synced: column.integer,
    created_at: column.text,
  },
  { indexes: { booking: ["booking_id"] } },
);

const tasks = new TableV2(
  {
    property_id: column.text,
    booking_id: column.text,
    type: column.text,
    description: column.text,
    status: column.text,
    due_date: column.text,
    completed_at: column.text,
  },
  { indexes: { property: ["property_id"] } },
);

const pricing_history = new TableV2(
  {
    property_id: column.text,
    date: column.text,
    suggested_price: column.real,
    actual_price: column.real,
    source: column.text,
    competitor_avg: column.real,
  },
  { indexes: { property_date: ["property_id", "date"] } },
);

const agent_memories = new TableV2(
  {
    property_id: column.text,
    guest_email: column.text,
    memory_type: column.text,
    content: column.text,
    confidence: column.real,
    created_at: column.text,
  },
  { indexes: { guest: ["guest_email"] } },
);

export const AppSchema = new Schema({
  properties,
  bookings,
  messages,
  tasks,
  pricing_history,
  agent_memories,
});

export type PropertyRecord = (typeof AppSchema)["types"]["properties"];
export type BookingRecord = (typeof AppSchema)["types"]["bookings"];
export type MessageRecord = (typeof AppSchema)["types"]["messages"];
export type TaskRecord = (typeof AppSchema)["types"]["tasks"];
export type PricingRecord = (typeof AppSchema)["types"]["pricing_history"];
export type AgentMemoryRecord = (typeof AppSchema)["types"]["agent_memories"];
