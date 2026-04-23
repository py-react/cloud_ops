import * as React from "react"
import { MemoryStickIcon as Memory } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ISystemInfo } from "./types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"

const formatBytes = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

const chartConfig = {
  containers: {
    label: "Docker Containers",
    color: "hsl(var(--primary))",
  },
  system: {
    label: "Available System",
    color: "hsl(var(--muted-foreground) / 0.2)",
  },
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10 rounded-xl transition-all duration-200">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export function MemroryStatsDetail({ data, isLoading }: { data: ISystemInfo["system_stats"]["memory"], isLoading?: boolean }) {
  const ChartContainerAny = ChartContainer as any;
  const ChartTooltipContentAny = ChartTooltipContent as any;

  if (!data) return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Memory className="w-4 h-4 text-primary" />
          Memory Infrastructure
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[120px]">
        <div className="text-muted-foreground text-xs italic">Awaiting telemetry...</div>
      </CardContent>
    </Card>
  );

  const total = data.total_memory_allocated_docker || 1;
  const used = data.total_memory_usage || 0;
  const free = Math.max(0, total - used);

  const chartData = [
    {
      name: "Usage",
      containers: used,
      system: free,
    }
  ];

  return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Memory className="w-4 h-4 text-primary" />
            Memory Utilization
          </CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold">
            Host Capacity: {formatBytes(total)}
          </CardDescription>
        </div>
        <div className="text-right">
            <div className="text-sm font-black text-primary">
                {((used / total) * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] font-bold text-muted-foreground uppercase">Allocation</div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex flex-col justify-between">
        <ChartContainerAny config={chartConfig} className="h-16 w-full">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="name" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContentAny />} />
            <Bar 
              dataKey="containers" 
              stackId="a" 
              fill="var(--color-containers)" 
              radius={[4, 0, 0, 4]} 
              barSize={32}
            />
            <Bar 
              dataKey="system" 
              stackId="a" 
              fill="var(--color-system)" 
              radius={[0, 4, 4, 0]} 
              barSize={32}
            />
          </BarChart>
        </ChartContainerAny>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-[9px] font-black uppercase text-primary/70 block mb-1">Docker Usage</span>
                <span className="text-sm font-black">{formatBytes(used)}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Available Host</span>
                <span className="text-sm font-black">{formatBytes(free)}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
