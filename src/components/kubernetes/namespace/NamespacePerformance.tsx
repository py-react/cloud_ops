import React from "react"
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from "@/components/ui/chart"
import { Activity, Cpu, Database } from "lucide-react"

const chartConfig = {
  cpu: {
    label: "CPU Usage",
    color: "hsl(var(--primary))",
  },
  memory: {
    label: "Memory Usage",
    color: "hsl(var(--chart-4))",
  }
}

interface NamespaceMetricsData {
  usage: {
    cpu: { used: string; unit: string };
    memory: { used: string; unit: string };
  }
}

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10 rounded-xl transition-all duration-200">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
);

export function NamespacePerformance({ data, isLoading }: { data?: NamespaceMetricsData, isLoading?: boolean }) {
  const ChartContainerAny = ChartContainer as any;
  const ChartTooltipContentAny = ChartTooltipContent as any;

  if (!data) return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Resource Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[120px]">
        <div className="text-muted-foreground text-xs italic">Pulling metrics...</div>
      </CardContent>
    </Card>
  );

  const cpuUsed = parseFloat(data.usage.cpu.used);
  const memUsed = parseFloat(data.usage.memory.used);
  
  // For namespaced view without quotas, we use a relative gauge or a known cap
  // Mapping to a radial view with a simulated max for scale
  const total = Math.max(cpuUsed, memUsed / 1024, 1) * 1.5;

  const chartData = [
    { name: "CPU", value: cpuUsed, fill: "var(--color-cpu)" },
    { name: "Memory", value: memUsed / 1024, fill: "var(--color-memory)" }, // Normalizing Mi to a display scale
  ];

  return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Namespace Performance
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
          Real-time Telemetry
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex flex-col justify-between">
        <ChartContainerAny config={chartConfig} className="aspect-auto h-[160px] w-full">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="120%"
            barSize={12}
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
                type="number"
                domain={[0, total]}
                angleAxisId={0}
                tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={5}
            />
            <ChartTooltip content={<ChartTooltipContentAny />} />
          </RadialBarChart>
        </ChartContainerAny>
        
        <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">CPU Usage</span>
                </div>
                <span className="text-sm font-black text-foreground">{data.usage.cpu.used} {data.usage.cpu.unit}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Memory</span>
                </div>
                <span className="text-sm font-black text-foreground">{data.usage.memory.used} {data.usage.memory.unit}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
