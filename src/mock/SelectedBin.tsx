import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMockDashboard } from "./useMockDashboard";

const Ctx = createContext<{ binId: string | null; setBinId: (id: string) => void }>({ binId: null, setBinId: () => {} });

export function SelectedBinProvider({ children }: { children: ReactNode }) {
  const { bins } = useMockDashboard();
  const [binId, setBinId] = useState<string | null>(bins[0]?.id ?? null);
  useEffect(() => {
    if (!binId || !bins.some((b) => b.id === binId)) setBinId(bins[0]?.id ?? null);
  }, [bins, binId]);
  return <Ctx.Provider value={{ binId, setBinId }}>{children}</Ctx.Provider>;
}
export const useSelectedBin = () => useContext(Ctx);
