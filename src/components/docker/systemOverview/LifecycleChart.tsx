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
  paused: {
    label: "Paused",
    color: "hsl(var(--chart-4))",
  },
  stopped: {
    label: "Stopped",
    color: "hsl(var(--muted-foreground))",
  },
}

interface LifecycleData {
  running: number;
  paused: number;
  stopped: number;
  total: number;
}

export function LifecycleChart({ data, isLoading }: { data: LifecycleData, isLoading?: boolean }) {
  const ChartContainerAny = ChartContainer as any;
  const ChartTooltipContentAny = ChartTooltipContent as any;

  const chartData = [
    { name: "Running", value: data.running, fill: "var(--color-running)" },
    { name: "Paused", value: data.paused, fill: "var(--color-paused)" },
    { name: "Stopped", value: data.stopped, fill: "var(--color-stopped)" },
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
          Container Lifecycle
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
          Fleet State Distribution
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
                          Units
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainerAny>
        
        <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-primary">Running</span>
                <span className="text-xs font-black">{data.running}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-amber-500">Paused</span>
                <span className="text-xs font-black">{data.paused}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Stopped</span>
                <span className="text-xs font-black">{data.stopped}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
