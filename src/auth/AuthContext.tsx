import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { KEYS, LS, MockUser, Role, SEED_USERS, uid } from "@/mock/mockData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export type PublicUser = Omit<MockUser, "password">;
const strip = ({ password: _p, ...u }: MockUser): PublicUser => u;

interface AuthCtx {
  loading: boolean;
  user: PublicUser | null;
  users: PublicUser[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  addUser: (u: { email: string; displayName: string; password: string; role: Role }) => Promise<void>;
  setRole: (id: string, role: Role) => Promise<void>;
  toggleAssignment: (id: string, binId: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  canControl: (binId: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<MockUser[]>(() => LS.get(KEYS.users, SEED_USERS));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { LS.set(KEYS.users, all); }, [all]);
  useEffect(() => {
    const t = setTimeout(() => { setSessionId(LS.get<string | null>(KEYS.session, null)); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);

  const current = all.find((u) => u.id === sessionId) ?? null;
  const isAdmin = current?.role === "admin";
  const requireAdmin = () => { if (!isAdmin) throw new Error("Only admins can do this"); };

  const signIn = useCallback(async (email: string, password: string) => {
    await delay(600);
    const u = all.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    LS.set(KEYS.session, u.id); setSessionId(u.id);
  }, [all]);

  const signOut = useCallback(() => { localStorage.removeItem(KEYS.session); setSessionId(null); }, []);

  const requestReset = useCallback(async (email: string) => {
    await delay(600);
    if (!all.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new Error("No account with that email");
  }, [all]);

  const resetPassword = useCallback(async (email: string, password: string) => {
    await delay(600);
    const e = email.trim().toLowerCase();
    if (!all.some((x) => x.email.toLowerCase() === e)) throw new Error("No account with that email");
    setAll((a) => a.map((x) => x.email.toLowerCase() === e ? { ...x, password } : x));
  }, [all]);

  const changePassword = useCallback(async (password: string) => {
    await delay(500);
    setAll((a) => a.map((x) => x.id === sessionId ? { ...x, password } : x));
  }, [sessionId]);

  const updateProfile = useCallback(async (displayName: string) => {
    await delay(500);
    setAll((a) => a.map((x) => x.id === sessionId ? { ...x, displayName } : x));
  }, [sessionId]);

  const addUser = useCallback(async (u: { email: string; displayName: string; password: string; role: Role }) => {
    await delay(500); requireAdmin();
    if (all.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) throw new Error("Email already in use");
    setAll((a) => [...a, { ...u, id: uid(), assignedBins: [] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, isAdmin]);

  const setRole = useCallback(async (id: string, role: Role) => {
    await delay(400); requireAdmin();
    if (id === sessionId) throw new Error("You cannot change your own role");
    setAll((a) => a.map((x) => x.id === id ? { ...x, role } : x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isAdmin]);

  const toggleAssignment = useCallback(async (id: string, binId: string) => {
    await delay(300); requireAdmin();
    setAll((a) => a.map((x) => x.id === id ? { ...x, assignedBins: x.assignedBins.includes(binId) ? x.assignedBins.filter((b) => b !== binId) : [...x.assignedBins, binId] } : x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const deleteUser = useCallback(async (id: string) => {
    await delay(400); requireAdmin();
    if (id === sessionId) throw new Error("You cannot delete yourself");
    setAll((a) => a.filter((x) => x.id !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isAdmin]);

  const canControl = useCallback((binId: string) => {
    if (!current) return false;
    if (current.role === "admin") return true;
    if (current.role === "personnel") return current.assignedBins.includes(binId);
    return false;
  }, [current]);

  const value = useMemo(() => ({
    loading, user: current ? strip(current) : null, users: all.map(strip),
    signIn, signOut, requestReset, resetPassword, changePassword, updateProfile, addUser, setRole, toggleAssignment, deleteUser, canControl,
  }), [loading, current, all, signIn, signOut, requestReset, resetPassword, changePassword, updateProfile, addUser, setRole, toggleAssignment, deleteUser, canControl]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
