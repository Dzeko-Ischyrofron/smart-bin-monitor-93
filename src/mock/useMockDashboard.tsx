import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import {
  Activity, Alert, Bin, Command, CommandAction, DeviceState, KEYS, LS, ScheduleItem, SEED_BINS, Telemetry, TICK_MS,
  detectCrossings, makeReading, seedBin, seedSchedule, stepDevice, uid,
} from "./mockData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface DashboardCtx {
  ready: boolean;
  bins: Bin[];
  telemetry: Record<string, Telemetry[]>;
  alerts: Alert[];
  activities: Activity[];
  schedule: ScheduleItem[];
  pendingCommands: Command[];
  lastTick: number;
  latest: (binId: string) => Telemetry | undefined;
  queueCommand: (binId: string, action: CommandAction) => Promise<void>;
  dismissAlerts: (ids: string[]) => Promise<void>;
  addSchedule: (item: Omit<ScheduleItem, "id" | "status">) => Promise<void>;
  completeSchedule: (id: string) => Promise<void>;
  addBin: (bin: Omit<Bin, "locked">) => Promise<void>;
  deleteBin: (id: string) => Promise<void>;
}

const Ctx = createContext<DashboardCtx | null>(null);

const ACTION_LABEL: Record<CommandAction, string> = { open: "Open lid", close: "Close lid", lock: "Lock lid", unlock: "Unlock lid", reset: "Reset bin" };
export const actionLabel = (a: string) => ACTION_LABEL[a as CommandAction] ?? a;

export function MockDashboardProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bins, setBins] = useState<Bin[]>(() => LS.get(KEYS.bins, SEED_BINS));
  const [telemetry, setTelemetry] = useState<Record<string, Telemetry[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => LS.get(KEYS.schedule, seedSchedule()));
  const [pendingCommands, setPending] = useState<Command[]>([]);
  const [lastTick, setLastTick] = useState(Date.now());
  const devices = useRef<Record<string, DeviceState>>({});
  const pendingRef = useRef<Command[]>([]);
  const binsRef = useRef(bins);
  binsRef.current = bins;

  useEffect(() => LS.set(KEYS.bins, bins), [bins]);
  useEffect(() => LS.set(KEYS.schedule, schedule), [schedule]);

  const seedOne = useCallback((id: string) => {
    const s = seedBin(id);
    devices.current[id] = s.state;
    return s;
  }, []);

  // initial seed (deferred so first paint shows a spinner, not a jump)
  useEffect(() => {
    const t = setTimeout(() => {
      const tel: Record<string, Telemetry[]> = {};
      const al: Alert[] = [];
      const ac: Activity[] = [];
      for (const b of binsRef.current) {
        const s = seedOne(b.id);
        tel[b.id] = s.readings; al.push(...s.alerts); ac.push(...s.activities);
      }
      setTelemetry(tel);
      setAlerts(al.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 40));
      setActivities(ac.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 60));
      setReady(true);
    }, 400);
    return () => clearTimeout(t);
  }, [seedOne]);

  // device tick
  useEffect(() => {
    if (!ready) return;
    const iv = setInterval(() => {
      const now = new Date();
      const newAlerts: Alert[] = [];
      const newActs: Activity[] = [];
      const cmds = pendingRef.current;
      pendingRef.current = [];
      setPending([]);
      setBins((prevBins) => {
        let nb = prevBins;
        for (const c of cmds) {
          const d = devices.current[c.binId];
          const bin = nb.find((b) => b.id === c.binId);
          if (!d || !bin) continue;
          let msg = `${ACTION_LABEL[c.action]} executed by device`;
          if (c.action === "open") {
            if (bin.locked) msg = "Open lid rejected — lid is locked"; else d.lidOpen = true;
          } else if (c.action === "close") d.lidOpen = false;
          else if (c.action === "lock") { d.lidOpen = false; nb = nb.map((b) => b.id === c.binId ? { ...b, locked: true } : b); }
          else if (c.action === "unlock") nb = nb.map((b) => b.id === c.binId ? { ...b, locked: false } : b);
          else if (c.action === "reset") { d.uptime = 0; d.lidOpen = false; }
          newActs.push({ id: uid(), type: c.action === "reset" ? "system" : "lid", message: msg, binId: c.binId, created_at: now.toISOString() });
        }
        return nb;
      });
      setTelemetry((prev) => {
        const next = { ...prev };
        for (const b of binsRef.current) {
          const d = devices.current[b.id];
          if (!d) continue;
          const list = prev[b.id] ?? [];
          const last = list[list.length - 1];
          const collected = stepDevice(d, TICK_MS / 60000 * 20, now); // accelerated for visible movement
          if (collected) newActs.push({ id: uid(), type: "collection", message: "Bin was collected and emptied", binId: b.id, created_at: now.toISOString() });
          const r = makeReading(b.id, d, new Date(now.getTime() - Math.random() * 4000), Math.random() < 0.08 ? 200 : 0);
          const ev = detectCrossings(last, r);
          newAlerts.push(...ev.alerts); newActs.push(...ev.activities);
          newActs.push({ id: uid(), type: "fill", message: `Reading received — fill ${r.waste_pct}%, gas ${r.gas_ppm_est} ppm`, binId: b.id, created_at: r.created_at });
          next[b.id] = [...list, r];
        }
        return next;
      });
      // queue state updates after telemetry computed (same tick)
      setTimeout(() => {
        if (newAlerts.length) setAlerts((a) => [...newAlerts, ...a].slice(0, 60));
        if (newActs.length) setActivities((a) => [...newActs.reverse(), ...a].slice(0, 80));
        setLastTick(Date.now());
      }, 0);
    }, TICK_MS);
    return () => clearInterval(iv);
  }, [ready]);

  const latest = useCallback((binId: string) => { const l = telemetry[binId]; return l?.[l.length - 1]; }, [telemetry]);

  const queueCommand = useCallback(async (binId: string, action: CommandAction) => {
    await delay(600 + Math.random() * 500);
    const c: Command = { id: uid(), binId, action, queuedAt: new Date().toISOString() };
    pendingRef.current = [...pendingRef.current, c];
    setPending(pendingRef.current);
    setActivities((a) => [{ id: uid(), type: "command", message: `${ACTION_LABEL[action]} command queued`, binId, created_at: c.queuedAt }, ...a]);
  }, []);

  const dismissAlerts = useCallback(async (ids: string[]) => {
    await delay(500);
    if (Math.random() < 0.05) throw new Error("Simulated network failure");
    setAlerts((a) => a.filter((x) => !ids.includes(x.id)));
  }, []);

  const addSchedule = useCallback(async (item: Omit<ScheduleItem, "id" | "status">) => {
    await delay(500);
    setSchedule((s) => [...s, { ...item, id: uid(), status: "pending" }]);
    setActivities((a) => [{ id: uid(), type: "collection", message: `Collection scheduled for ${new Date(item.scheduledAt).toLocaleString()}`, binId: item.binId, created_at: new Date().toISOString() }, ...a]);
  }, []);

  const completeSchedule = useCallback(async (id: string) => {
    await delay(500);
    let binId = "";
    setSchedule((s) => s.map((x) => { if (x.id === id) { binId = x.binId; return { ...x, status: "completed" }; } return x; }));
    const d = devices.current[binId];
    if (d) d.fill = 4;
    setActivities((a) => [{ id: uid(), type: "collection", message: "Collection marked complete — bin emptied", binId, created_at: new Date().toISOString() }, ...a]);
  }, []);

  const addBin = useCallback(async (bin: Omit<Bin, "locked">) => {
    await delay(500);
    if (binsRef.current.some((b) => b.id.toLowerCase() === bin.id.toLowerCase())) throw new Error("A bin with this ID already exists");
    const s = seedOne(bin.id);
    setBins((b) => [...b, { ...bin, locked: false }]);
    setTelemetry((t) => ({ ...t, [bin.id]: s.readings }));
  }, [seedOne]);

  const deleteBin = useCallback(async (id: string) => {
    await delay(400);
    setBins((b) => b.filter((x) => x.id !== id));
    setAlerts((a) => a.filter((x) => x.binId !== id));
    delete devices.current[id];
  }, []);

  const value = useMemo(() => ({
    ready, bins, telemetry, alerts, activities, schedule, pendingCommands, lastTick, latest,
    queueCommand, dismissAlerts, addSchedule, completeSchedule, addBin, deleteBin,
  }), [ready, bins, telemetry, alerts, activities, schedule, pendingCommands, lastTick, latest, queueCommand, dismissAlerts, addSchedule, completeSchedule, addBin, deleteBin]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMockDashboard() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMockDashboard must be used within MockDashboardProvider");
  return c;
}
