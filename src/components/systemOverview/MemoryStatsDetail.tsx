import * as React from "react"
import { TrendingUp ,MemoryStickIcon as Memory} from "lucide-react"
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

export function MemroryStatsDetail({data}:{data:ISystemInfo["system_stats"]["memory"]}) {
    const chartData = [
        {
          name: "Used",
          value:data.total_memory_usage,
          fill:'hsl(var(--color-used))'
        },
        {
          name: "Free",
          value: data.total_memory_allocated_docker - data.total_memory_usage,
          fill:'hsl(var(--color-free))',
        },
        
      ]
      const totalMemoryAllocated = data.total_memory_allocated


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Memory className="w-6 h-6" />
            System Memory Monitor
        </CardTitle>
        <CardDescription>Allocation({formatBytes(totalMemoryAllocated)}) and Usage({formatBytes(data.total_memory_usage)})</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(value,payload)=>{
                return `${payload[0].name} ${formatBytes(payload[0].value)}`
              }} />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
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
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
