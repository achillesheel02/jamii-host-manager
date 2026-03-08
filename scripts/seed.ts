/**
 * Seed script for Jamii Host Manager
 *
 * Run against Supabase to populate test data:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed.ts
 *
 * Uses Supabase service role key (not anon key) to bypass RLS.
 * Data is based on real Lavington, Nairobi Airbnb market rates.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- Seed Data ----------

// Ciru's property at Leo Residences
const PROPERTY = {
  name: "Seventh Haven",
  address: "Leo Residences, Unit C10-2, 10th Floor, Lavington, Nairobi",
  description:
    "Modern 1-bedroom apartment with panoramic city views. High-speed WiFi, fully equipped kitchen, gym access, and 24/7 security. 10 minutes to Westlands CBD.",
  amenities: JSON.stringify([
    "WiFi",
    "Kitchen",
    "Gym",
    "Pool",
    "Parking",
    "Security",
    "Elevator",
    "Washer",
    "Air Conditioning",
    "City View",
  ]),
};

// Synthetic bookings (seeded from real Lavington market rates: KES 7,500-12,000/night)
const BOOKINGS = [
  {
    guest_name: "Sarah Johnson",
    guest_email: "sarah.j@email.com",
    guest_phone: "+1-555-0101",
    check_in: "2026-03-12",
    check_out: "2026-03-15",
    status: "confirmed",
    total_price: 28500,
    notes: "Business traveler, needs early check-in",
  },
  {
    guest_name: "James Odhiambo",
    guest_email: "james.odh@email.com",
    guest_phone: "+254-722-000001",
    check_in: "2026-03-18",
    check_out: "2026-03-22",
    status: "confirmed",
    total_price: 34000,
    notes: "Returning guest - was here in January",
  },
  {
    guest_name: "Emma Watson",
    guest_email: "emma.w@email.com",
    guest_phone: "+44-7700-900001",
    check_in: "2026-02-20",
    check_out: "2026-02-25",
    status: "completed",
    total_price: 47500,
    notes: "Loved the city view, asked about monthly rates",
  },
  {
    guest_name: "Michael Chen",
    guest_email: "m.chen@email.com",
    guest_phone: "+86-138-0000001",
    check_in: "2026-02-10",
    check_out: "2026-02-12",
    status: "completed",
    total_price: 17000,
    notes: "Weekend stay, quiet guest",
  },
  {
    guest_name: "James Odhiambo",
    guest_email: "james.odh@email.com",
    guest_phone: "+254-722-000001",
    check_in: "2026-01-05",
    check_out: "2026-01-10",
    status: "completed",
    total_price: 42500,
    notes: "First stay - very positive feedback",
  },
];

// Sample messages
const MESSAGES = [
  {
    booking_index: 0, // Sarah Johnson's upcoming booking
    messages: [
      {
        sender: "guest",
        content: "Hi! Is early check-in possible around 10am?",
        ai_generated: false,
      },
      {
        sender: "host",
        content:
          "Hi Sarah! Yes, we can arrange early check-in at 10am for you. The apartment will be freshly cleaned and ready. See you on the 12th!",
        ai_generated: true,
      },
      {
        sender: "guest",
        content: "Perfect, thanks! Also, is there a good coffee shop nearby?",
        ai_generated: false,
      },
    ],
  },
  {
    booking_index: 1, // James Odhiambo's upcoming booking
    messages: [
      {
        sender: "guest",
        content: "Hey, looking forward to staying again! Same unit as last time?",
        ai_generated: false,
      },
      {
        sender: "host",
        content:
          "Welcome back James! Yes, you'll be in the same C10-2 unit with the view you loved. I've noted your preference for extra towels from your last stay.",
        ai_generated: true,
      },
    ],
  },
];

// Agent memories for returning guest
const AGENT_MEMORIES = [
  {
    guest_email: "james.odh@email.com",
    memory_type: "preference",
    content: "Prefers extra towels. Likes the city-view side of the apartment.",
    confidence: 0.85,
  },
  {
    guest_email: "james.odh@email.com",
    memory_type: "feedback",
    content:
      "Gave 5-star review after first stay. Mentioned enjoying the rooftop gym.",
    confidence: 0.9,
  },
  {
    guest_email: "emma.w@email.com",
    memory_type: "interest",
    content: "Asked about monthly rates. Potential long-term booking opportunity.",
    confidence: 0.7,
  },
  {
    guest_email: "sarah.j@email.com",
    memory_type: "requirement",
    content: "Business traveler. Needs reliable WiFi and quiet environment.",
    confidence: 0.8,
  },
];

// Pricing history (Lavington market: KES 7,500-12,000/night average)
const PRICING_HISTORY = [
  { date: "2026-03-01", suggested_price: 8500, actual_price: 8500, source: "algorithm", competitor_avg: 9200 },
  { date: "2026-03-02", suggested_price: 8500, actual_price: 8500, source: "algorithm", competitor_avg: 9100 },
  { date: "2026-03-07", suggested_price: 10500, actual_price: 10500, source: "algorithm", competitor_avg: 10800 },
  { date: "2026-03-08", suggested_price: 10500, actual_price: null, source: "algorithm", competitor_avg: 10900 },
  { date: "2026-03-14", suggested_price: 9500, actual_price: null, source: "algorithm", competitor_avg: 9800 },
  { date: "2026-03-15", suggested_price: 10500, actual_price: null, source: "algorithm", competitor_avg: 10200 },
];

// Tasks
const TASKS = [
  {
    booking_index: 0,
    type: "cleaning",
    description: "Deep clean before Sarah Johnson check-in",
    status: "pending",
    due_date: "2026-03-11",
  },
  {
    booking_index: 0,
    type: "supplies",
    description: "Restock coffee pods and toiletries",
    status: "pending",
    due_date: "2026-03-11",
  },
  {
    booking_index: 1,
    type: "cleaning",
    description: "Turnover clean after Sarah, prep for James",
    status: "pending",
    due_date: "2026-03-17",
  },
  {
    booking_index: 1,
    type: "supplies",
    description: "Extra towels for James (returning guest preference)",
    status: "pending",
    due_date: "2026-03-17",
  },
];

// ---------- Seed Execution ----------

async function seed() {
  console.log("Seeding Jamii database...\n");

  // We need a host user. For hackathon, create via Supabase auth first.
  // This script assumes a host user already exists. We'll use a placeholder.
  // In production, the user signs up via the app.

  // Check for existing users
  const { data: users } = await supabase.auth.admin.listUsers();
  let hostId: string;

  if (users && users.users.length > 0) {
    hostId = users.users[0].id;
    console.log(`Using existing user: ${hostId}`);
  } else {
    // Create a test user
    const { data: newUser, error: userError } =
      await supabase.auth.admin.createUser({
        email: "host@jamii.app",
        password: "jamii-demo-2026",
        email_confirm: true,
      });
    if (userError) {
      console.error("Failed to create test user:", userError.message);
      process.exit(1);
    }
    hostId = newUser.user.id;
    console.log(`Created test user: ${hostId}`);
  }

  // 1. Insert property
  const { data: property, error: propError } = await supabase
    .from("properties")
    .upsert({ ...PROPERTY, host_id: hostId }, { onConflict: "name" })
    .select()
    .single();

  if (propError) {
    console.error("Property insert error:", propError.message);
    process.exit(1);
  }
  console.log(`Property: ${property.name} (${property.id})`);

  // 2. Insert bookings
  const bookingIds: string[] = [];
  for (const booking of BOOKINGS) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({ ...booking, property_id: property.id })
      .select()
      .single();

    if (error) {
      console.error(`Booking error (${booking.guest_name}):`, error.message);
      continue;
    }
    bookingIds.push(data.id);
    console.log(`  Booking: ${data.guest_name} (${data.check_in} - ${data.check_out})`);
  }

  // 3. Insert messages
  for (const msgGroup of MESSAGES) {
    const bookingId = bookingIds[msgGroup.booking_index];
    if (!bookingId) continue;

    for (let i = 0; i < msgGroup.messages.length; i++) {
      const msg = msgGroup.messages[i];
      const timestamp = new Date(Date.now() - (msgGroup.messages.length - i) * 3600000);
      await supabase.from("messages").insert({
        booking_id: bookingId,
        sender: msg.sender,
        content: msg.content,
        ai_generated: msg.ai_generated,
        sent: true,
        synced: true,
        created_at: timestamp.toISOString(),
      });
    }
    console.log(`  Messages: ${msgGroup.messages.length} for booking ${msgGroup.booking_index}`);
  }

  // 4. Insert agent memories
  for (const mem of AGENT_MEMORIES) {
    await supabase.from("agent_memories").insert({
      property_id: property.id,
      ...mem,
    });
  }
  console.log(`  Agent memories: ${AGENT_MEMORIES.length}`);

  // 5. Insert pricing history
  for (const price of PRICING_HISTORY) {
    await supabase.from("pricing_history").insert({
      property_id: property.id,
      ...price,
    });
  }
  console.log(`  Pricing history: ${PRICING_HISTORY.length} entries`);

  // 6. Insert tasks
  for (const task of TASKS) {
    const bookingId = bookingIds[task.booking_index];
    await supabase.from("tasks").insert({
      property_id: property.id,
      booking_id: bookingId,
      type: task.type,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
    });
  }
  console.log(`  Tasks: ${TASKS.length}`);

  console.log("\nSeed complete!");
  console.log(`\nTest credentials:\n  Email: host@jamii.app\n  Password: jamii-demo-2026`);
}

seed().catch(console.error);
