// Single source of mock data + simulation rules. Swap this for a real API later.

export const BIN_DEPTH_CM = 60;
export const TICK_MS = 30_000;
export const THRESHOLDS = {
  fillCritical: 80,
  fillWarning: 60,
  batteryDanger: 30,
  gasCritical: 300,
  gasModerate: 150,
} as const;

export type Role = "admin" | "personnel" | "viewer";
export type LevelZone = "low" | "medium" | "high" | "full";
export type OdorLevel = "normal" | "moderate" | "high";
export type BinHealth = "normal" | "warning" | "critical";

export interface Telemetry {
  bin_id: string;
  distance_cm: number;
  bin_depth_cm: number;
  waste_filled_cm: number;
  waste_pct: number;
  level_zone: LevelZone;
  is_full: boolean;
  lid_open: boolean;
  gas_raw: number;
  gas_ppm_est: number;
  gas_alert: boolean;
  pir_detected: boolean;
  servo_angle: number;
  battery_pct: number;
  rssi_dbm: number;
  wifi_ssid: string;
  fw_version: string;
  uptime_s: number;
  created_at: string;
}

export interface Bin { id: string; name: string; location: string; locked: boolean }
export type AlertType = "critical" | "warning" | "info";
export type AlertCategory = "fill" | "battery" | "odor" | "lid" | "connection";
export interface Alert { id: string; type: AlertType; category: AlertCategory; message: string; binId: string; created_at: string }
export type ActivityType = "fill" | "alert" | "collection" | "command" | "lid" | "battery" | "system";
export interface Activity { id: string; type: ActivityType | string; message: string; binId: string; created_at: string }
export type ScheduleStatus = "pending" | "in-progress" | "completed" | "overdue" | "cancelled";
export type Priority = "low" | "medium" | "high";
export interface ScheduleItem { id: string; binId: string; scheduledAt: string; estimatedFill: number; status: ScheduleStatus; priority: Priority }
export type CommandAction = "open" | "close" | "lock" | "unlock" | "reset";
export interface Command { id: string; binId: string; action: CommandAction; queuedAt: string }
export interface MockUser { id: string; email: string; password: string; displayName: string; role: Role; assignedBins: string[] }

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const SEED_BINS: Bin[] = [
  { id: "BIN-001", name: "Smart Waste Bin", location: "Main Location", locked: false },
  { id: "BIN-002", name: "Cafeteria Bin", location: "Cafeteria Entrance", locked: false },
];

export const SEED_USERS: MockUser[] = [
  { id: "u-admin", email: "admin@smartbin.demo", password: "admin123", displayName: "Ada Admin", role: "admin", assignedBins: ["BIN-001", "BIN-002"] },
  { id: "u-personnel", email: "personnel@smartbin.demo", password: "personnel123", displayName: "Pat Personnel", role: "personnel", assignedBins: ["BIN-001"] },
  { id: "u-viewer", email: "viewer@smartbin.demo", password: "viewer123", displayName: "Val Viewer", role: "viewer", assignedBins: [] },
];

// ---------- derived helpers ----------
export const levelZone = (pct: number): LevelZone =>
  pct >= 90 ? "full" : pct >= THRESHOLDS.fillCritical ? "high" : pct >= THRESHOLDS.fillWarning ? "medium" : "low";
export const odorLevel = (ppm: number): OdorLevel =>
  ppm >= THRESHOLDS.gasCritical ? "high" : ppm >= THRESHOLDS.gasModerate ? "moderate" : "normal";
export const binHealth = (t?: Telemetry): BinHealth => {
  if (!t) return "warning";
  if (t.waste_pct >= THRESHOLDS.fillCritical || t.gas_ppm_est >= THRESHOLDS.gasCritical || t.battery_pct < THRESHOLDS.batteryDanger) return "critical";
  if (t.waste_pct >= THRESHOLDS.fillWarning || t.gas_ppm_est >= THRESHOLDS.gasModerate) return "warning";
  return "normal";
};
export const rssiToPct = (rssi: number) => Math.max(0, Math.min(100, Math.round(((rssi + 95) / 55) * 100)));

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const noise = (s: number) => (Math.random() - 0.5) * 2 * s;

// ---------- device physics ----------
export interface DeviceState { fill: number; battery: number; lidOpen: boolean; uptime: number }

export function makeReading(binId: string, s: DeviceState, at: Date, fillSpike = 0): Telemetry {
  const hour = at.getHours() + at.getMinutes() / 60;
  const diurnal = Math.max(0, Math.sin(((hour - 8) / 24) * Math.PI * 2)); // peak ~ afternoon
  const ppm = clamp(Math.round(60 + diurnal * 90 + s.fill * 2.1 + noise(35) + fillSpike), 20, 900);
  const pct = clamp(Math.round(s.fill), 0, 100);
  const filled = Math.round((pct / 100) * BIN_DEPTH_CM * 10) / 10;
  const pir = Math.random() < 0.12;
  return {
    bin_id: binId,
    distance_cm: Math.round((BIN_DEPTH_CM - filled + noise(0.8)) * 10) / 10,
    bin_depth_cm: BIN_DEPTH_CM,
    waste_filled_cm: filled,
    waste_pct: pct,
    level_zone: levelZone(pct),
    is_full: pct >= 90,
    lid_open: s.lidOpen,
    gas_raw: Math.round(ppm * 3.4 + noise(20)),
    gas_ppm_est: ppm,
    gas_alert: ppm >= THRESHOLDS.gasCritical,
    pir_detected: pir,
    servo_angle: s.lidOpen ? 90 : 0,
    battery_pct: clamp(Math.round(s.battery), 0, 100),
    rssi_dbm: Math.round(-58 + noise(12)),
    wifi_ssid: "SmartBin-IoT",
    fw_version: "1.4.2",
    uptime_s: Math.round(s.uptime),
    created_at: at.toISOString(),
  };
}

/** Advance device physics by dtMin minutes. Returns true if a collection happened. */
export function stepDevice(s: DeviceState, dtMin: number, at: Date): boolean {
  const hour = at.getHours();
  const busy = hour >= 7 && hour <= 20 ? 1 : 0.25;
  s.fill += (dtMin / 60) * (1.3 * busy + noise(0.6));
  s.fill = clamp(s.fill, 0, 100);
  s.battery -= (dtMin / 60) * (0.12 + Math.random() * 0.05);
  s.uptime += dtMin * 60;
  let collected = false;
  if (s.fill > 88 + Math.random() * 10 && Math.random() < 0.3) {
    s.fill = 3 + Math.random() * 6;
    collected = true;
  }
  if (s.battery < 18 && Math.random() < 0.2) s.battery = 100; // recharged
  return collected;
}

export interface Seed { telemetry: Record<string, Telemetry[]>; alerts: Alert[]; activities: Activity[]; state: Record<string, DeviceState> }

export function seedBin(binId: string, now = new Date()): { readings: Telemetry[]; alerts: Alert[]; activities: Activity[]; state: DeviceState } {
  const start = now.getTime() - 42 * 24 * 3600_000;
  const s: DeviceState = { fill: 10 + Math.random() * 20, battery: 90 + Math.random() * 10, lidOpen: false, uptime: 3600 };
  const readings: Telemetry[] = [];
  const alerts: Alert[] = [];
  const activities: Activity[] = [];
  const recentCutoff = now.getTime() - 48 * 3600_000;
  let t = start;
  let prev: Telemetry | undefined;
  while (t < now.getTime()) {
    // irregular interval 15-45 min, occasional silent gaps (3-9h)
    let dt = 15 + Math.random() * 30;
    if (Math.random() < 0.006) dt += 180 + Math.random() * 360;
    t += dt * 60_000;
    if (t > now.getTime()) break;
    const at = new Date(t);
    const collected = stepDevice(s, dt, at);
    const r = makeReading(binId, s, at, Math.random() < 0.03 ? 180 : 0);
    readings.push(r);
    if (t > recentCutoff) {
      if (collected) activities.push({ id: uid(), type: "collection", message: "Bin was collected and emptied", binId, created_at: r.created_at });
      const ev = detectCrossings(prev, r);
      alerts.push(...ev.alerts);
      activities.push(...ev.activities);
    }
    prev = r;
  }
  // make the demo bin interesting: finish in a high-odor state
  if (binId === "BIN-001" && readings.length) {
    s.fill = 78;
    const r = makeReading(binId, s, new Date(now.getTime() - 60_000), 0);
    r.gas_ppm_est = 380; r.gas_raw = 1292; r.gas_alert = true;
    const ev = detectCrossings(readings[readings.length - 1], r);
    readings.push(r);
    alerts.push(...ev.alerts);
    activities.push(...ev.activities);
  }
  return { readings, alerts, activities, state: s };
}

/** Compare two readings and emit alert + activity rows for crossed thresholds. */
export function detectCrossings(prev: Telemetry | undefined, r: Telemetry): { alerts: Alert[]; activities: Activity[] } {
  const alerts: Alert[] = [];
  const activities: Activity[] = [];
  const at = r.created_at;
  const b = r.bin_id;
  const push = (type: AlertType, category: AlertCategory, message: string, actType: ActivityType = "alert") => {
    alerts.push({ id: uid(), type, category, message, binId: b, created_at: at });
    activities.push({ id: uid(), type: actType, message, binId: b, created_at: at });
  };
  const p = prev ?? { ...r, waste_pct: 0, gas_ppm_est: 0, battery_pct: 100 };
  if (p.waste_pct < THRESHOLDS.fillCritical && r.waste_pct >= THRESHOLDS.fillCritical)
    push("critical", "fill", `Bin is ${r.waste_pct}% full — collection needed`, "fill");
  else if (p.waste_pct < THRESHOLDS.fillWarning && r.waste_pct >= THRESHOLDS.fillWarning)
    push("warning", "fill", `Fill level reached ${r.waste_pct}%`, "fill");
  if (p.gas_ppm_est < THRESHOLDS.gasCritical && r.gas_ppm_est >= THRESHOLDS.gasCritical)
    push("critical", "odor", `⚠️ Emergency: Critical odor level (${r.gas_ppm_est} ppm) — immediate attention required`);
  if (p.battery_pct >= THRESHOLDS.batteryDanger && r.battery_pct < THRESHOLDS.batteryDanger)
    push("warning", "battery", `Battery at ${r.battery_pct}% — recharge soon`, "battery");
  return { alerts, activities };
}

export function seedSchedule(): ScheduleItem[] {
  const now = Date.now();
  const h = 3600_000;
  return [
    { id: uid(), binId: "BIN-001", scheduledAt: new Date(now + 2 * h).toISOString(), estimatedFill: 95, status: "pending", priority: "high" },
    { id: uid(), binId: "BIN-002", scheduledAt: new Date(now + 20 * h).toISOString(), estimatedFill: 75, status: "pending", priority: "medium" },
    { id: uid(), binId: "BIN-001", scheduledAt: new Date(now - 22 * h).toISOString(), estimatedFill: 50, status: "completed", priority: "low" },
    { id: uid(), binId: "BIN-002", scheduledAt: new Date(now - 5 * h).toISOString(), estimatedFill: 70, status: "cancelled", priority: "medium" },
  ];
}

// ---------- localStorage helpers ----------
export const LS = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } },
};
export const KEYS = { users: "sb.users", session: "sb.session", bins: "sb.bins", schedule: "sb.schedule" };

// ---------- bucketing ----------
export type Range = "day" | "week" | "month";
export const RANGE_CFG: Record<Range, { spanMs: number; bucketMs: number; label: string }> = {
  day: { spanMs: 24 * 3600_000, bucketMs: 3600_000, label: "Last 24 hours (hourly)" },
  week: { spanMs: 7 * 24 * 3600_000, bucketMs: 6 * 3600_000, label: "Last 7 days (6-hour buckets)" },
  month: { spanMs: 30 * 24 * 3600_000, bucketMs: 24 * 3600_000, label: "Last 30 days (daily)" },
};

export interface Bucket { ts: number; label: string; count: number; [k: string]: number | string | null }

export function bucketize(
  readings: Telemetry[],
  range: Range,
  fields: Record<string, (r: Telemetry) => number>,
  sums: Record<string, (r: Telemetry) => number> = {},
  now = Date.now(),
): Bucket[] {
  const { spanMs, bucketMs } = RANGE_CFG[range];
  const end = Math.floor(now / bucketMs) * bucketMs + bucketMs;
  const start = end - Math.ceil(spanMs / bucketMs) * bucketMs;
  const n = Math.round((end - start) / bucketMs);
  const acc = Array.from({ length: n }, () => ({ count: 0, f: {} as Record<string, number>, s: {} as Record<string, number> }));
  for (const r of readings) {
    const ts = new Date(r.created_at).getTime();
    if (ts < start || ts >= end) continue;
    const i = Math.floor((ts - start) / bucketMs);
    const a = acc[i];
    a.count++;
    for (const k in fields) a.f[k] = (a.f[k] ?? 0) + fields[k](r);
    for (const k in sums) a.s[k] = (a.s[k] ?? 0) + sums[k](r);
  }
  return acc.map((a, i) => {
    const ts = start + i * bucketMs;
    const d = new Date(ts);
    const label =
      range === "day" ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : range === "week" ? `${d.toLocaleDateString([], { weekday: "short" })} ${String(d.getHours()).padStart(2, "0")}h`
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
    const out: Bucket = { ts, label, count: a.count };
    for (const k in fields) out[k] = a.count ? Math.round((a.f[k] / a.count) * 10) / 10 : null;
    for (const k in sums) out[k] = a.count ? a.s[k] : null;
    return out;
  });
}

export const CSV_COLUMNS: (keyof Telemetry)[] = [
  "created_at", "waste_pct", "waste_filled_cm", "distance_cm", "bin_depth_cm", "level_zone", "is_full",
  "lid_open", "gas_raw", "gas_ppm_est", "gas_alert", "pir_detected", "rssi_dbm", "wifi_ssid", "fw_version", "uptime_s",
];
export function toCsv(rows: Telemetry[]): string {
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => esc(r[c])).join(","))].join("\n");
}

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};
