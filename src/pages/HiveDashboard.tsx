import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useStatus } from "@powersync/react";
import { formatDate, formatDateShort, formatCurrency } from "@/lib/format";
import { useBeeChatContext } from "@/lib/BeeChatContext";

/**
 * Hive Dashboard — Intelligence, not inventory.
 *
 * Visual identity: honeycomb-inspired, warm amber tones for intelligence,
 * cool blue for sync state. The dashboard tells a story:
 * "Your AI is learning about your guests, and that knowledge
 * works even when the internet doesn't."
 */
export function HiveDashboard() {
  const { setPageContext } = useBeeChatContext();
  useEffect(() => { setPageContext({ page: "dashboard" }); }, [setPageContext]);
  const syncStatus = useStatus();
  const hasSynced = syncStatus.hasSynced;

  // ── Core queries ──────────────────────────────────────────────────
  const { data: properties } = useQuery("SELECT * FROM properties ORDER BY name");

  const { data: upcomingBookings } = useQuery(`
    SELECT b.*, p.name as property_name
    FROM bookings b
    JOIN properties p ON p.id = b.property_id
    WHERE b.check_in >= date('now') AND b.status IN ('confirmed', 'checked_in')
    ORDER BY b.check_in
    LIMIT 8
  `);

  const { data: memories } = useQuery(
    "SELECT * FROM agent_memories ORDER BY confidence DESC",
  );

  const { data: pricingData } = useQuery(`
    SELECT * FROM pricing_history
    WHERE accuracy_score IS NOT NULL
    ORDER BY date DESC
    LIMIT 42
  `);

  const { data: pendingTasks } = useQuery(
    "SELECT t.*, p.name as property_name FROM tasks t JOIN properties p ON p.id = t.property_id WHERE t.status = 'pending' ORDER BY t.due_date LIMIT 6",
  );

  const { data: revenueData } = useQuery(`
    SELECT
      SUM(CASE WHEN check_in >= date('now', 'start of month') THEN total_price ELSE 0 END) as this_month,
      SUM(CASE WHEN check_in >= date('now', 'start of month', '-1 month') AND check_in < date('now', 'start of month') THEN total_price ELSE 0 END) as last_month,
      COUNT(DISTINCT CASE WHEN guest_return_count > 0 THEN guest_email END) as returning_guests,
      COUNT(DISTINCT guest_email) as total_guests
    FROM bookings WHERE status IN ('confirmed', 'checked_in', 'completed')
  `);

  // ── Computed metrics ──────────────────────────────────────────────
  const rev = revenueData[0] as Record<string, unknown> | undefined;
  const thisMonth = Number(rev?.this_month ?? 0);
  const lastMonth = Number(rev?.last_month ?? 0);
  const returningGuests = Number(rev?.returning_guests ?? 0);
  const totalGuests = Number(rev?.total_guests ?? 0);
  const returnRate = totalGuests > 0 ? Math.round((returningGuests / totalGuests) * 100) : 0;

  const freshMemories = memories.filter((m) => (m.decay_lambda ?? 1) < 0.8).length;
  const totalMemories = memories.length;
  const memoryHealth = totalMemories > 0 ? Math.round((freshMemories / totalMemories) * 100) : 0;

  const avgAccuracy = pricingData.length > 0
    ? pricingData.reduce((sum, p) => sum + (Number(p.accuracy_score) || 0), 0) / pricingData.length
    : 0;
  const calibrationPct = Math.round(avgAccuracy * 100);

  const nextCheckIn = upcomingBookings[0];
  const daysUntil = nextCheckIn?.check_in
    ? Math.max(0, Math.ceil((new Date(nextCheckIn.check_in + "T00:00:00").getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      {/* ── Hive Sync Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200/60 px-5 py-4">
        {/* Decorative honeycomb pattern */}
        <div className="absolute right-0 top-0 opacity-[0.06] pointer-events-none">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {[0,1,2,3,4,5].map(i => {
              const x = 30 + (i % 3) * 55 + (Math.floor(i / 3) * 27);
              const y = 15 + Math.floor(i / 3) * 48;
              return <polygon key={i} points={`${x},${y-20} ${x+17},${y-10} ${x+17},${y+10} ${x},${y+20} ${x-17},${y+10} ${x-17},${y-10}`} fill="currentColor" className="text-amber-900" />;
            })}
          </svg>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-amber-900">
              <span className="inline-block mr-2 text-xl">&#x2B21;</span>
              Hive Intelligence
            </h1>
            <p className="text-sm text-amber-700/80 mt-0.5">
              {totalMemories} memories across {properties.length} properties
              {hasSynced && " — synced to this device"}
              {!hasSynced && syncStatus.connecting && " — syncing..."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SyncPulse connected={syncStatus.connected ?? false} hasSynced={hasSynced ?? false} />
          </div>
        </div>
      </div>

      {/* ── Honeycomb Metrics ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <HexMetric
          icon="&#x1F9E0;"
          label="Memory Health"
          value={`${memoryHealth}%`}
          detail={`${freshMemories}/${totalMemories} validated`}
          tier={memoryHealth > 60 ? "strong" : memoryHealth > 30 ? "growing" : "weak"}
        />
        <HexMetric
          icon="&#x1F3AF;"
          label="Price Calibration"
          value={calibrationPct > 0 ? `${calibrationPct}%` : "-"}
          detail={pricingData.length > 0 ? `${pricingData.length} predictions` : "No data yet"}
          tier={calibrationPct > 85 ? "strong" : calibrationPct > 70 ? "growing" : "weak"}
        />
        <HexMetric
          icon="&#x1F501;"
          label="Return Guests"
          value={returnRate > 0 ? `${returnRate}%` : "-"}
          detail={totalGuests > 0 ? `${returningGuests} of ${totalGuests}` : "No guests yet"}
          tier={returnRate > 20 ? "strong" : returnRate > 0 ? "growing" : "neutral"}
        />
        <HexMetric
          icon="&#x1F4B0;"
          label="Revenue"
          value={thisMonth > 0 ? formatCurrency(thisMonth) : "-"}
          detail={lastMonth > 0 && thisMonth > 0
            ? `${thisMonth >= lastMonth ? "+" : ""}${Math.round(((thisMonth - lastMonth) / lastMonth) * 100)}%`
            : "This month"}
          tier={thisMonth >= lastMonth && thisMonth > 0 ? "strong" : thisMonth > 0 ? "growing" : "neutral"}
        />
        <HexMetric
          icon="&#x1F6AC;"
          label="Next Arrival"
          value={daysUntil != null ? (daysUntil === 0 ? "Today" : `${daysUntil}d`) : "-"}
          detail={nextCheckIn ? String(nextCheckIn.guest_name).split(" ")[0] : "None scheduled"}
          tier={daysUntil != null && daysUntil <= 1 ? "alert" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Guest Intelligence + Pricing ───────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming arrivals with AI knowledge */}
          <section>
            <SectionHeader icon="&#x2B21;" title="Arriving Soon" subtitle="Guest intelligence from the Hive" />
            {upcomingBookings.length === 0 ? (
              <EmptyState message="No upcoming check-ins. The Hive is idle." />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => {
                  const guestMemories = memories.filter((m) => m.guest_email === b.guest_email);
                  const isReturning = Number(b.guest_return_count ?? 0) > 0;
                  return (
                    <GuestIntelCard
                      key={b.id}
                      booking={b}
                      guestMemories={guestMemories}
                      isReturning={isReturning}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Pricing Calibration */}
          <section>
            <SectionHeader icon="&#x1F4C8;" title="Pricing Calibration" subtitle="How accurate are the Hive's price suggestions?" />
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <PricingCalibration data={pricingData} properties={properties} />
            </div>
          </section>
        </div>

        {/* ── Right Column: Hive Status ──────────────────────── */}
        <div className="space-y-6">

          {/* Memory Hive */}
          <section>
            <SectionHeader icon="&#x1F9E0;" title="Memory Cells" subtitle={`${totalMemories} things the Hive remembers`} />
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
              {memories.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  The Hive has no memories yet. Start conversations to teach it.
                </p>
              ) : (
                <>
                  {memories.slice(0, 5).map((m) => (
                    <MemoryCell key={m.id} memory={m} />
                  ))}
                  {memories.length > 5 && (
                    <p className="text-xs text-amber-600/60 text-center pt-1">
                      +{memories.length - 5} more cells in the Hive
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Task Queue */}
          <section>
            <SectionHeader icon="&#x26A1;" title="Action Queue" subtitle="Tasks the Hive flagged" />
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              {(pendingTasks as Array<Record<string, unknown>>).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">All clear. No pending actions.</p>
              ) : (
                (pendingTasks as Array<Record<string, unknown>>).map((t) => (
                  <div key={String(t.id)} className="flex items-start gap-2.5 py-1">
                    <span className="text-sm flex-shrink-0 mt-0.5">{taskEmoji(String(t.type))}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{String(t.description)}</p>
                      <p className="text-xs text-gray-400">
                        {String(t.property_name)} &middot; {formatDateShort(String(t.due_date))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Properties */}
          <section>
            <SectionHeader icon="&#x1F3E0;" title="Properties" />
            <div className="space-y-2">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  to={`/property/${p.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-3 hover:border-amber-300 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.address}</p>
                </Link>
              ))}
              <Link
                to="/add-property"
                className="block text-center text-sm text-amber-600 hover:text-amber-700 py-2 border border-dashed border-amber-200 rounded-xl hover:border-amber-400 transition-colors"
              >
                + Add Property
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────

function SyncPulse({ connected, hasSynced }: { connected: boolean; hasSynced: boolean }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-amber-200/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-medium text-green-700">Live Sync</span>
      </div>
    );
  }
  if (hasSynced) {
    return (
      <div className="flex items-center gap-2 bg-amber-100/60 rounded-full px-3 py-1.5 border border-amber-300/50">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-xs font-medium text-amber-700">Local Hive</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-red-50 rounded-full px-3 py-1.5 border border-red-200/50">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs font-medium text-red-600">No Data</span>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <span className="text-xs text-gray-400 ml-auto">{subtitle}</span>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-amber-200 p-8 text-center">
      <p className="text-sm text-amber-600/70">{message}</p>
    </div>
  );
}

type MetricTier = "strong" | "growing" | "weak" | "neutral" | "alert";

function HexMetric({ icon, label, value, detail, tier }: {
  icon: string; label: string; value: string; detail: string; tier: MetricTier;
}) {
  const tierStyles: Record<MetricTier, string> = {
    strong: "border-green-200 bg-gradient-to-b from-green-50/50 to-white",
    growing: "border-amber-200 bg-gradient-to-b from-amber-50/50 to-white",
    weak: "border-red-200 bg-gradient-to-b from-red-50/30 to-white",
    neutral: "border-gray-200 bg-white",
    alert: "border-orange-300 bg-gradient-to-b from-orange-50 to-white",
  };
  const tierDot: Record<MetricTier, string> = {
    strong: "bg-green-500",
    growing: "bg-amber-500",
    weak: "bg-red-400",
    neutral: "bg-gray-300",
    alert: "bg-orange-500 animate-pulse",
  };

  return (
    <div className={`rounded-xl border p-3.5 ${tierStyles[tier]}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ml-auto ${tierDot[tier]}`} />
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{detail}</p>
    </div>
  );
}

function GuestIntelCard({ booking, guestMemories, isReturning }: {
  booking: Record<string, unknown>;
  guestMemories: Array<Record<string, unknown>>;
  isReturning: boolean;
}) {
  const daysAway = Math.max(0, Math.ceil(
    (new Date(String(booking.check_in) + "T00:00:00").getTime() - Date.now()) / 86400000
  ));

  return (
    <Link
      to={`/booking/${booking.id}`}
      className={`block rounded-xl border p-4 hover:shadow-md transition-all ${
        daysAway <= 1
          ? "border-orange-300 bg-gradient-to-r from-orange-50 to-white"
          : "border-gray-200 bg-white hover:border-amber-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{String(booking.guest_name)}</h3>
            {isReturning && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Returning
              </span>
            )}
            {daysAway === 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Today
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {String(booking.property_name)} &middot;{" "}
            {formatDate(String(booking.check_in))} &rarr; {formatDate(String(booking.check_out))}
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-700">
          {formatCurrency(Number(booking.total_price))}
        </span>
      </div>

      {/* Guest Intelligence from the Hive */}
      {guestMemories.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-100">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs">&#x2B21;</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Hive knows {guestMemories.length} thing{guestMemories.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {guestMemories.slice(0, 2).map((m) => (
              <div key={String(m.id)} className="flex items-start gap-2">
                <StrengthBar
                  confidence={Number(m.confidence ?? 0)}
                  lambda={Number(m.decay_lambda ?? 1)}
                />
                <p className="text-xs text-gray-600 leading-snug">{String(m.content)}</p>
              </div>
            ))}
            {guestMemories.length > 2 && (
              <p className="text-[10px] text-amber-500">+{guestMemories.length - 2} more memories</p>
            )}
          </div>
        </div>
      )}

      {/* No intel yet */}
      {guestMemories.length === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 italic">
            No Hive memories for this guest yet. The AI will learn from conversations.
          </p>
        </div>
      )}
    </Link>
  );
}

function StrengthBar({ confidence, lambda }: { confidence: number; lambda: number }) {
  const strength = confidence * Math.exp(-lambda * 0.1);
  const pct = Math.round(strength * 100);
  const color = strength > 0.7 ? "bg-green-500" : strength > 0.4 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex-shrink-0 w-10 mt-1" title={`${pct}% strength`}>
      <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MemoryCell({ memory }: { memory: Record<string, unknown> }) {
  const confidence = Number(memory.confidence ?? 0);
  const lambda = Number(memory.decay_lambda ?? 1);
  const timesValidated = Number(memory.times_validated ?? 1);
  const isStrong = lambda < 0.8;
  const isDecaying = lambda >= 1.0 && timesValidated <= 1;

  return (
    <div className={`rounded-lg px-3 py-2.5 border transition-colors ${
      isDecaying
        ? "border-red-200 bg-red-50/50"
        : isStrong
          ? "border-green-200 bg-green-50/30"
          : "border-gray-100 bg-gray-50/50"
    }`}>
      <div className="flex items-start gap-2">
        <StrengthBar confidence={confidence} lambda={lambda} />
        <p className="text-sm text-gray-800 flex-1 leading-snug">{String(memory.content)}</p>
      </div>
      <div className="flex items-center gap-2 mt-1.5 ml-12">
        <span className="text-[10px] text-gray-400">{String(memory.guest_email)}</span>
        <span className="text-[10px] text-gray-300">&middot;</span>
        <span className="text-[10px] text-gray-400">{String(memory.memory_type)}</span>
        {isStrong && (
          <span className="text-[10px] text-green-600 font-medium ml-auto">
            Validated {timesValidated}x
          </span>
        )}
        {isDecaying && (
          <span className="text-[10px] text-red-500 font-medium ml-auto">
            Needs validation
          </span>
        )}
      </div>
    </div>
  );
}

function PricingCalibration({ data, properties }: {
  data: Array<Record<string, unknown>>;
  properties: Array<Record<string, unknown>>;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-400">No pricing predictions scored yet.</p>
        <p className="text-xs text-amber-500 mt-1">
          The Hive needs the migration applied to track pricing accuracy.
        </p>
      </div>
    );
  }

  const byProperty = new Map<string, Array<Record<string, unknown>>>();
  for (const d of data) {
    const pid = String(d.property_id);
    if (!byProperty.has(pid)) byProperty.set(pid, []);
    byProperty.get(pid)!.push(d);
  }

  return (
    <div className="space-y-5">
      {Array.from(byProperty.entries()).map(([pid, entries]) => {
        const prop = properties.find((p) => p.id === pid);
        const propName = prop ? String(prop.name) : "Unknown";
        const avgAcc = entries.reduce((s, e) => s + Number(e.accuracy_score ?? 0), 0) / entries.length;
        const recent = [...entries.slice(0, 7)].reverse();

        return (
          <div key={pid}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">{propName}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                avgAcc > 0.9 ? "bg-green-100 text-green-700" :
                avgAcc > 0.8 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {Math.round(avgAcc * 100)}% accurate
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-10">
              {recent.map((e, i) => {
                const acc = Number(e.accuracy_score ?? 0);
                const h = Math.max(4, acc * 40);
                const bg = acc > 0.9 ? "bg-green-400" : acc > 0.8 ? "bg-amber-400" : "bg-red-400";
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${bg} transition-all`}
                    style={{ height: `${h}px` }}
                    title={`${String(e.date)}: ${Math.round(acc * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-300">7d ago</span>
              <span className="text-[9px] text-gray-300">Today</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function taskEmoji(type: string): string {
  const map: Record<string, string> = {
    cleaning: "\uD83E\uDDF9",
    supplies: "\uD83D\uDCE6",
    maintenance: "\uD83D\uDD27",
    turnover: "\uD83D\uDD04",
    inspection: "\uD83D\uDD0D",
  };
  return map[type] || "\uD83D\uDCCB";
}
