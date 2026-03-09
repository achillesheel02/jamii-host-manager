/**
 * Seed script for Jamii Host Manager
 *
 * Run against Supabase to populate test data:
 *   npx tsx --env-file=.env scripts/seed.ts
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

const PROPERTIES = [
  {
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
  },
  {
    name: "Lavington Green Studio",
    address: "Valley Arcade, Studio 4B, Lavington, Nairobi",
    description:
      "Cosy studio in a quiet Lavington compound with garden views. Walking distance to Lavington Mall. Ideal for solo travelers and digital nomads.",
    amenities: JSON.stringify([
      "WiFi",
      "Kitchen",
      "Garden",
      "Parking",
      "Security",
      "Washer",
    ]),
  },
  {
    name: "Kilimani Executive Suite",
    address: "Dennis Pritt Road, Apt 12A, Kilimani, Nairobi",
    description:
      "Spacious 2-bedroom executive suite in Kilimani. Perfect for business travelers and families. Near Yaya Centre and Junction Mall.",
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
      "Balcony",
    ]),
  },
];

// Bookings across properties (index 0 = Seventh Haven, 1 = Lavington Green, 2 = Kilimani)
const BOOKINGS = [
  // Seventh Haven bookings
  {
    propertyIndex: 0,
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
    propertyIndex: 0,
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
    propertyIndex: 0,
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
    propertyIndex: 0,
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
    propertyIndex: 0,
    guest_name: "James Odhiambo",
    guest_email: "james.odh@email.com",
    guest_phone: "+254-722-000001",
    check_in: "2026-01-05",
    check_out: "2026-01-10",
    status: "completed",
    total_price: 42500,
    notes: "First stay - very positive feedback",
  },
  // Lavington Green bookings
  {
    propertyIndex: 1,
    guest_name: "Amina Wanjiku",
    guest_email: "amina.w@email.com",
    guest_phone: "+254-733-000002",
    check_in: "2026-03-10",
    check_out: "2026-03-14",
    status: "confirmed",
    total_price: 22000,
    notes: "Digital nomad, working remotely for a week",
  },
  {
    propertyIndex: 1,
    guest_name: "Peter Mwangi",
    guest_email: "peter.m@email.com",
    guest_phone: "+254-700-000003",
    check_in: "2026-02-28",
    check_out: "2026-03-02",
    status: "completed",
    total_price: 13500,
    notes: "Weekend getaway",
  },
  {
    propertyIndex: 1,
    guest_name: "Lisa Mueller",
    guest_email: "lisa.m@email.com",
    guest_phone: "+49-170-0000001",
    check_in: "2026-03-20",
    check_out: "2026-03-27",
    status: "confirmed",
    total_price: 38500,
    notes: "German tourist, first time in Kenya",
  },
  // Kilimani Executive bookings
  {
    propertyIndex: 2,
    guest_name: "David Kimani",
    guest_email: "david.k@email.com",
    guest_phone: "+254-712-000004",
    check_in: "2026-03-08",
    check_out: "2026-03-12",
    status: "checked_in",
    total_price: 48000,
    notes: "Corporate stay, receipt needed",
  },
  {
    propertyIndex: 2,
    guest_name: "Sophie Blanc",
    guest_email: "sophie.b@email.com",
    guest_phone: "+33-6-00000001",
    check_in: "2026-03-15",
    check_out: "2026-03-20",
    status: "confirmed",
    total_price: 60000,
    notes: "Traveling with partner, celebrating anniversary",
  },
  {
    propertyIndex: 2,
    guest_name: "Robert Ochieng",
    guest_email: "robert.o@email.com",
    guest_phone: "+254-720-000005",
    check_in: "2026-02-15",
    check_out: "2026-02-20",
    status: "completed",
    total_price: 55000,
    notes: "Family of 4, requested extra bedding",
  },
];

// Messages for selected bookings
const MESSAGES = [
  {
    bookingIndex: 0, // Sarah Johnson
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
    bookingIndex: 1, // James Odhiambo
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
  {
    bookingIndex: 5, // Amina Wanjiku
    messages: [
      {
        sender: "guest",
        content: "Hi! How fast is the WiFi? I need to do video calls.",
        ai_generated: false,
      },
      {
        sender: "host",
        content:
          "Hi Amina! The WiFi is fibre — typically 50-80 Mbps. More than enough for video calls. There's also a quiet desk area by the window.",
        ai_generated: true,
      },
    ],
  },
  {
    bookingIndex: 8, // David Kimani (checked in)
    messages: [
      {
        sender: "guest",
        content: "I've arrived. The apartment is great! Can I get a corporate receipt?",
        ai_generated: false,
      },
      {
        sender: "host",
        content:
          "Glad you like it David! I'll prepare the corporate receipt with your company details. Just send me the company name and KRA PIN and I'll have it ready before checkout.",
        ai_generated: true,
      },
    ],
  },
];

// Agent memories
const AGENT_MEMORIES = [
  {
    propertyIndex: 0,
    guest_email: "james.odh@email.com",
    memory_type: "preference",
    content: "Prefers extra towels. Likes the city-view side of the apartment.",
    confidence: 0.85,
  },
  {
    propertyIndex: 0,
    guest_email: "james.odh@email.com",
    memory_type: "feedback",
    content:
      "Gave 5-star review after first stay. Mentioned enjoying the rooftop gym.",
    confidence: 0.9,
  },
  {
    propertyIndex: 0,
    guest_email: "emma.w@email.com",
    memory_type: "interest",
    content: "Asked about monthly rates. Potential long-term booking opportunity.",
    confidence: 0.7,
  },
  {
    propertyIndex: 0,
    guest_email: "sarah.j@email.com",
    memory_type: "requirement",
    content: "Business traveler. Needs reliable WiFi and quiet environment.",
    confidence: 0.8,
  },
  {
    propertyIndex: 1,
    guest_email: "amina.w@email.com",
    memory_type: "preference",
    content: "Digital nomad. Prefers desk near window. Needs strong WiFi.",
    confidence: 0.75,
  },
  {
    propertyIndex: 2,
    guest_email: "david.k@email.com",
    memory_type: "requirement",
    content: "Corporate traveler. Needs receipts with company details and KRA PIN.",
    confidence: 0.8,
  },
  {
    propertyIndex: 2,
    guest_email: "robert.o@email.com",
    memory_type: "preference",
    content: "Family with kids. Requested extra bedding and early check-in for nap time.",
    confidence: 0.85,
  },
];

// Pricing history — last 2 weeks for each property
function generatePricingHistory(propertyIndex: number): Array<{
  propertyIndex: number;
  date: string;
  suggested_price: number;
  actual_price: number | null;
  source: string;
  competitor_avg: number;
}> {
  const baseRates = [8500, 5500, 12000];
  const compAvgs = [9200, 6000, 11500];
  const base = baseRates[propertyIndex];
  const comp = compAvgs[propertyIndex];

  const entries = [];
  for (let d = 13; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    const dateStr = date.toISOString().slice(0, 10);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const rate = isWeekend ? Math.round(base * 1.15) : base;
    const compRate = isWeekend ? Math.round(comp * 1.12) : comp;

    entries.push({
      propertyIndex,
      date: dateStr,
      suggested_price: rate,
      actual_price: d > 3 ? rate : null,
      source: "algorithm",
      competitor_avg: compRate,
    });
  }
  return entries;
}

const PRICING_HISTORY = [
  ...generatePricingHistory(0),
  ...generatePricingHistory(1),
  ...generatePricingHistory(2),
];

// Tasks across properties
const TASKS = [
  {
    propertyIndex: 0,
    bookingIndex: 0,
    type: "cleaning",
    description: "Deep clean before Sarah Johnson check-in",
    status: "pending",
    due_date: "2026-03-11",
  },
  {
    propertyIndex: 0,
    bookingIndex: 0,
    type: "supplies",
    description: "Restock coffee pods and toiletries",
    status: "pending",
    due_date: "2026-03-11",
  },
  {
    propertyIndex: 0,
    bookingIndex: 1,
    type: "cleaning",
    description: "Turnover clean after Sarah, prep for James",
    status: "pending",
    due_date: "2026-03-17",
  },
  {
    propertyIndex: 0,
    bookingIndex: 1,
    type: "supplies",
    description: "Extra towels for James (returning guest preference)",
    status: "pending",
    due_date: "2026-03-17",
  },
  {
    propertyIndex: 1,
    bookingIndex: 5,
    type: "cleaning",
    description: "Pre-arrival clean for Amina",
    status: "pending",
    due_date: "2026-03-09",
  },
  {
    propertyIndex: 1,
    bookingIndex: null as number | null,
    type: "maintenance",
    description: "Fix slow drain in bathroom sink",
    status: "pending",
    due_date: "2026-03-08",
  },
  {
    propertyIndex: 2,
    bookingIndex: 9,
    type: "turnover",
    description: "Full turnover for Sophie — anniversary setup requested",
    status: "pending",
    due_date: "2026-03-14",
  },
  {
    propertyIndex: 2,
    bookingIndex: null as number | null,
    type: "inspection",
    description: "Quarterly AC filter replacement",
    status: "pending",
    due_date: "2026-03-15",
  },
];

// ---------- Seed Execution ----------

async function seed() {
  console.log("Seeding Jamii database...\n");

  // Check for existing users
  const { data: users } = await supabase.auth.admin.listUsers();
  let hostId: string;

  if (users && users.users.length > 0) {
    hostId = users.users[0].id;
    console.log(`Using existing user: ${hostId}`);
  } else {
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

  // Clean existing data (idempotent re-seeding)
  console.log("Clearing existing data...");
  await supabase.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("agent_memories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("pricing_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 1. Insert properties
  const propertyIds: string[] = [];
  for (const prop of PROPERTIES) {
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...prop, host_id: hostId })
      .select()
      .single();

    if (error) {
      console.error(`Property error (${prop.name}):`, error.message);
      process.exit(1);
    }
    propertyIds.push(data.id);
    console.log(`  Property: ${data.name} (${data.id})`);
  }

  // 2. Insert bookings
  const bookingIds: string[] = [];
  for (const booking of BOOKINGS) {
    const { propertyIndex, ...bookingData } = booking;
    const { data, error } = await supabase
      .from("bookings")
      .insert({ ...bookingData, property_id: propertyIds[propertyIndex] })
      .select()
      .single();

    if (error) {
      console.error(`Booking error (${booking.guest_name}):`, error.message);
      bookingIds.push("");
      continue;
    }
    bookingIds.push(data.id);
    console.log(`  Booking: ${data.guest_name} (${data.check_in} - ${data.check_out})`);
  }

  // 3. Insert messages
  for (const msgGroup of MESSAGES) {
    const bookingId = bookingIds[msgGroup.bookingIndex];
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
    console.log(`  Messages: ${msgGroup.messages.length} for ${BOOKINGS[msgGroup.bookingIndex].guest_name}`);
  }

  // 4. Insert agent memories
  for (const mem of AGENT_MEMORIES) {
    const { propertyIndex, ...memData } = mem;
    await supabase.from("agent_memories").insert({
      property_id: propertyIds[propertyIndex],
      ...memData,
    });
  }
  console.log(`  Agent memories: ${AGENT_MEMORIES.length}`);

  // 5. Insert pricing history
  for (const price of PRICING_HISTORY) {
    const { propertyIndex, ...priceData } = price;
    await supabase.from("pricing_history").insert({
      property_id: propertyIds[propertyIndex],
      ...priceData,
    });
  }
  console.log(`  Pricing history: ${PRICING_HISTORY.length} entries`);

  // 6. Insert tasks
  for (const task of TASKS) {
    const { propertyIndex, bookingIndex, ...taskData } = task;
    await supabase.from("tasks").insert({
      property_id: propertyIds[propertyIndex],
      booking_id: bookingIndex != null ? bookingIds[bookingIndex] : null,
      ...taskData,
    });
  }
  console.log(`  Tasks: ${TASKS.length}`);

  console.log("\nSeed complete!");
  console.log(`\n${PROPERTIES.length} properties, ${BOOKINGS.length} bookings, ${TASKS.length} tasks`);
  console.log(`\nTest credentials:\n  Email: host@jamii.app\n  Password: jamii-demo-2026`);
}

seed().catch(console.error);
