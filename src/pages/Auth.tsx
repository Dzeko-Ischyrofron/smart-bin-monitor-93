import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Recycle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthContext";
import { SEED_USERS } from "@/mock/mockData";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export default function Auth() {
  const { signIn, user, loading, requestReset } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  if (!loading && user) return <Navigate to={loc.state?.from ?? "/"} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgot) {
      const r = schema.shape.email.safeParse(email);
      if (!r.success) return setErrors({ email: r.error.issues[0].message });
      setBusy(true);
      try { await requestReset(email); toast.success("Reset link ready — set your new password"); nav(`/reset-password?email=${encodeURIComponent(email.trim())}`); }
      catch (err) { toast.error((err as Error).message); }
      finally { setBusy(false); }
      return;
    }
    const r = schema.safeParse({ email, password });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setBusy(true);
    try { await signIn(email, password); toast.success("Signed in"); nav(loc.state?.from ?? "/", { replace: true }); }
    catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card variant="elevated" className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 rounded-xl gradient-primary w-fit"><Recycle className="h-7 w-7 text-primary-foreground" /></div>
          <CardTitle className="text-2xl">{forgot ? "Forgot password" : "Sign in to SmartBin"}</CardTitle>
          <CardDescription>{forgot ? "Enter your account email to reset your password." : "IoT Waste Management dashboard"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            {!forgot && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setForgot(true); setErrors({}); }}>Forgot password?</button>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{forgot ? "Continue" : "Sign in"}
            </Button>
            {forgot && <Button type="button" variant="ghost" className="w-full" onClick={() => setForgot(false)}>Back to sign in</Button>}
          </form>
          {!forgot && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Demo accounts (click to fill)</p>
              {SEED_USERS.map((u) => (
                <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className="w-full flex items-center justify-between rounded-lg border border-border p-2.5 text-left text-sm hover:bg-secondary/60 transition-colors">
                  <span><span className="font-medium">{u.email}</span><span className="block text-xs text-muted-foreground">password: {u.password}</span></span>
                  <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
