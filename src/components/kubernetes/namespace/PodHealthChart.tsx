import * as React from "react"
import { Box, Circle } from "lucide-react"
import { Pie, PieChart, Label } from "recharts"
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
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  running: {
    label: "Running",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-4))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
  succeeded: {
    label: "Succeeded",
    color: "hsl(var(--muted-foreground))",
  },
}

interface PodHealthData {
  Running: number;
  Pending: number;
  Failed: number;
  Succeeded: number;
  total: number;
}

export function PodHealthChart({ data, isLoading }: { data: PodHealthData, isLoading?: boolean }) {
  const ChartContainerAny = ChartContainer as any;
  const ChartTooltipContentAny = ChartTooltipContent as any;

  const chartData = [
    { name: "Running", value: data.Running, fill: "var(--color-running)" },
    { name: "Pending", value: data.Pending, fill: "var(--color-pending)" },
    { name: "Failed", value: data.Failed, fill: "var(--color-failed)" },
    { name: "Succeeded", value: data.Succeeded, fill: "var(--color-succeeded)" },
  ].filter(d => d.value > 0);

  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-10 rounded-xl transition-all duration-200">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <Card className="flex flex-col relative border-border/50 shadow-sm bg-white/50 backdrop-blur-sm h-full">
      {isLoading && <LoadingOverlay />}
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Box className="w-4 h-4 text-primary" />
          Pod Health Status
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
          Phase Distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 flex flex-col justify-between">
        <ChartContainerAny
          config={chartConfig}
          className="mx-auto aspect-square h-[160px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContentAny hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              strokeWidth={8}
              stroke="white"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-black"
                        >
                          {data.total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 15}
                          className="fill-muted-foreground text-[8px] font-black uppercase"
                        >
                          Pods
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainerAny>
        
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-primary">Running</span>
                <span className="text-xs font-black">{data.Running}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-amber-500">Pending</span>
                <span className="text-xs font-black">{data.Pending}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-destructive">Failed</span>
                <span className="text-xs font-black">{data.Failed}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Done</span>
                <span className="text-xs font-black">{data.Succeeded}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
