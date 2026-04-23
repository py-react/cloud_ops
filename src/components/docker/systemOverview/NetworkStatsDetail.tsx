import React from "react"
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from "recharts"
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
import { ISystemInfo } from "./types"
import { formatBytes } from "@/libs/utils"
import { Activity, ArrowDown, ArrowUp } from "lucide-react"

const chartConfig = {
  received: {
    label: "Received",
    color: "hsl(var(--primary))",
  },
  sent: {
    label: "Sent",
    color: "hsl(var(--chart-4))",
  }
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10 rounded-xl transition-all duration-200">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export function NetworkStatsDetail({ data, isLoading }: { data: ISystemInfo["system_stats"]["network"], isLoading?: boolean }) {
  const ChartContainerAny = ChartContainer as any;
  const ChartTooltipContentAny = ChartTooltipContent as any;

  if (!data) return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Network Throughput
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[120px]">
        <div className="text-muted-foreground text-xs italic">Sniffing packets...</div>
      </CardContent>
    </Card>
  );

  const total = data.total_bytes_recv + data.total_bytes_sent || 1;
  const chartData = [
    {
      name: "Received",
      value: data.total_bytes_recv,
      fill: "var(--color-received)",
    },
    {
      name: "Sent",
      value: data.total_bytes_sent,
      fill: "var(--color-sent)",
    },
  ];

  return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Network Traffic
          </CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold">
            Aggregated Interface I/O
          </CardDescription>
        </div>
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
                    <ArrowDown className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Ingress</span>
                </div>
                <span className="text-sm font-black text-foreground">{formatBytes(data.total_bytes_recv)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Egress</span>
                </div>
                <span className="text-sm font-black text-foreground">{formatBytes(data.total_bytes_sent)}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
