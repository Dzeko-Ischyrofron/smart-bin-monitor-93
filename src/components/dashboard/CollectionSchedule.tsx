import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Truck, MapPin, CheckCircle, AlertCircle } from "lucide-react";

interface ScheduleItem {
  id: string;
  binId: string;
  binName: string;
  location: string;
  scheduledTime: string;
  estimatedFill: number;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
}

interface CollectionScheduleProps {
  schedule: ScheduleItem[];
}

const statusStyles = {
  pending: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock },
  "in-progress": { bg: "bg-info/10", text: "text-info", icon: Truck },
  completed: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", icon: AlertCircle },
};

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export function CollectionSchedule({ schedule }: CollectionScheduleProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Collection Schedule
        </CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          <Truck className="h-4 w-4" />
          Schedule Collection
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {schedule.map((item) => {
            const StatusIcon = statusStyles[item.status].icon;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${statusStyles[item.status].bg}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusStyles[item.status].text}`} />
                    <span className="font-medium">{item.binName}</span>
                    <span className="text-xs text-muted-foreground">({item.binId})</span>
                  </div>
                  <Badge className={priorityStyles[item.priority]}>
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.scheduledTime}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Est. Fill: {item.estimatedFill}%
                  </span>
                  <Badge variant="outline" className={statusStyles[item.status].text}>
                    {item.status.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
