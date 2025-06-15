import React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ISystemInfo } from "./types"
import { formatBytes } from "@/libs/utils"
import { Activity } from "lucide-react"


const chartConfig = {
    recived: {
        label: "Recived",
        color: "hsl(var(--chart-1))",
      },
      sent: {
        label: "Sent",
        color: "hsl(var(--chart-2))",
      }
} satisfies ChartConfig


export function NetworkStatsDetail({data}:{data:ISystemInfo["system_stats"]["network"]}) {
    const chartData = [
        {
            value:data.total_bytes_recv,
            name:"recived",
        },
        {
            value:data.total_bytes_sent,
            name:"sent",
        },
      ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            System Network Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-[15%]">
        <ChartContainer config={chartConfig}>
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
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" fill="var(--color-desktop)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={value=>formatBytes(value)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
