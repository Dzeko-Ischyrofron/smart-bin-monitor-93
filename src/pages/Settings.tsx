import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6 max-w-2xl">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to dashboard</Link>
        <Card variant="elevated">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{user?.displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
            <div><Button variant="outline" onClick={signOut}>Sign out</Button></div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
