import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { MockDashboardProvider } from "./mock/useMockDashboard";
import { SelectedBinProvider } from "./mock/SelectedBin";

export const FullSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <FullSpinner />;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner richColors position="top-right" />
    <AuthProvider>
      <MockDashboardProvider>
        <SelectedBinProvider>
          <HashRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Protected><Index /></Protected>} />
              <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </SelectedBinProvider>
      </MockDashboardProvider>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
