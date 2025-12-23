import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Lock, Unlock, Settings } from "lucide-react";
import { toast } from "sonner";

interface ControlPanelProps {
  bins: Array<{ id: string; name: string }>;
}

export function ControlPanel({ bins }: ControlPanelProps) {
  const [selectedBin, setSelectedBin] = useState(bins[0]?.id || "");
  const [lidLocked, setLidLocked] = useState(false);
  const [autoSpray, setAutoSpray] = useState(true);

  const handleSprayTrigger = () => {
    toast.success(`Spray activated for ${bins.find(b => b.id === selectedBin)?.name}`);
  };

  const handleLidToggle = () => {
    setLidLocked(!lidLocked);
    toast.success(`Lid ${!lidLocked ? "locked" : "unlocked"} for ${bins.find(b => b.id === selectedBin)?.name}`);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Smart Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bin Selector */}
        <div className="space-y-2">
          <Label>Select Bin</Label>
          <Select value={selectedBin} onValueChange={setSelectedBin}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bin" />
            </SelectTrigger>
            <SelectContent>
              {bins.map((bin) => (
                <SelectItem key={bin.id} value={bin.id}>
                  {bin.name} ({bin.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Manual Spray */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Manual Spray</Label>
            <p className="text-xs text-muted-foreground">Trigger odor control</p>
          </div>
          <Button size="sm" onClick={handleSprayTrigger} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Spray Now
          </Button>
        </div>

        {/* Auto Spray Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Auto Spray</Label>
            <p className="text-xs text-muted-foreground">Automatic odor detection</p>
          </div>
          <Switch checked={autoSpray} onCheckedChange={setAutoSpray} />
        </div>

        {/* Lid Lock */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Lid Lock</Label>
            <p className="text-xs text-muted-foreground">{lidLocked ? "Locked" : "Unlocked"}</p>
          </div>
          <Button size="sm" variant={lidLocked ? "destructive" : "outline"} onClick={handleLidToggle} className="gap-2">
            {lidLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {lidLocked ? "Unlock" : "Lock"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
