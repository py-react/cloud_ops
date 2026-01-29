import * as React from "react"
import { TrendingUp, MemoryStickIcon as Memory } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { ISystemInfo } from "./types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const formatBytes = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

const chartConfig = {
  Used: {
    label: '',
    color: 'hsl(var(--chart-1))',
  },
  Free: {
    label: '',
    color: 'hsl(var(--chart-2))',
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
    <Card className="flex flex-col relative">
      {isLoading && <LoadingOverlay />}
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Memory className="w-4 h-4" />
          System Memory Monitor
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground text-sm">Waiting for stats...</div>
      </CardContent>
    </Card>
  );

  const chartData = [
    {
      name: "Used",
      value: data.total_memory_usage,
      fill: 'hsl(var(--color-used))'
    },
    {
      name: "Free",
      value: data.total_memory_allocated_docker - data.total_memory_usage,
      fill: 'hsl(var(--color-free))',
    },

  ]
  const totalMemoryAllocated = data.total_memory_allocated


  return (
    <Card className="flex flex-col h-full relative">
      {isLoading && <LoadingOverlay />}
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Memory className="w-4 h-4 text-primary" />
          </div>
          System Memory Monitor
        </CardTitle>
        <CardDescription>Allocation({formatBytes(totalMemoryAllocated)}) and Usage({formatBytes(data.total_memory_usage)})</CardDescription>

      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainerAny
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContentAny labelFormatter={(value: any, payload: any) => {
                return `${payload[0]?.name} ${formatBytes(payload[0]?.value)}`
              }} />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              strokeWidth={5}
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {formatBytes(data.total_memory_allocated_docker)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          System
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainerAny>
      </CardContent>
    </Card >
  )
}
