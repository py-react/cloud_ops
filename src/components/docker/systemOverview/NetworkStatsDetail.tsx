import React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from "@/components/ui/chart"
import { ISystemInfo } from "./types"
import { formatBytes } from "@/libs/utils"
import { Activity } from "lucide-react"


const chartConfig = {
  received: {
    label: "Received",
    color: "hsl(var(--chart-1))",
  },
  sent: {
    label: "Sent",
    color: "hsl(var(--chart-2))",
  }
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl transition-all duration-200">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);


export function NetworkStatsDetail({ data, isLoading }: { data: ISystemInfo["system_stats"]["network"], isLoading?: boolean }) {
  if (!data) return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          System Network Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground text-sm">Waiting for stats...</div>
      </CardContent>
    </Card>
  );

  const chartData = [
    {
      value: data.total_bytes_recv,
      name: "received",
      color: "hsl(var(--chart-1))"
    },
    {
      value: data.total_bytes_sent,
      name: "sent",
      color: "hsl(var(--chart-2))"
    },
  ]

  return (
    <Card className="flex flex-col h-full relative">
      {isLoading && <LoadingOverlay />}
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          System Network Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={8}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground font-medium"
                fontSize={12}
                formatter={(value: any) => formatBytes(value as number)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
