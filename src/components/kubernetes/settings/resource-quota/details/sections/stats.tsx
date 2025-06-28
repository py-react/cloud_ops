import React from "react";
import { Box, CpuIcon, Gauge, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pie, PieChart, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TooltipWrapper } from "@/components/ui/tooltip";

const chartConfig = {
  Used: {
    label: '',
    color: 'hsl(var(--color-used))',
  },
  Free: {
    label: '',
    color: 'hsl(var(--color-free))',
  },
};

const resourceIconMap: Record<string, React.ReactNode> = {
  cpu: <CpuIcon className="w-4 h-4 text-blue-500" />,
  memory: <Gauge className="w-4 h-4 text-green-500" />,
  pods: <Box className="w-4 h-4 text-purple-500" />,
};

const getResourceType = (key: string) => {
  if (key.includes("cpu")) return "cpu";
  if (key.includes("memory")) return "memory";
  if (key.includes("pod")) return "pods";
  return "other";
};

const parseNumber = (val: string | number) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Handle "1k" as 1000, "200Gi" as 200*1024, etc.
  if (/^\d+k$/i.test(val)) return parseFloat(val) * 1000;
  if (/^\d+Gi$/i.test(val)) return parseFloat(val) * 1024;
  if (/^\d+Mi$/i.test(val)) return parseFloat(val);
  return parseFloat(val.replace(/[^\d.]/g, ""));
};

const formatValue = (val: string | number, type: string) => {
  if (type === "memory") {
    if (typeof val === "string" && val.match(/Gi|Mi|Ki/)) return val;
    return `${val} Mi`;
  }
  if (type === "cpu") {
    if (typeof val === "string" && val.match(/m|k/)) return val;
    return val;
  }
  return val;
};

function ResourceQuotaPieStat({
  title,
  used,
  limit,
  icon,
  type = "memory",
  formatValueOverride,
}: {
  title: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
  type?: "cpu" | "memory" | string;
  formatValueOverride?: (val: string | number) => string | number;
}) {
  const chartData = [
    { name: "Used", value: used, fill: "hsl(var(--color-used))" },
    { name: "Free", value: Math.max(limit - used, 0), fill: "hsl(var(--color-free))" },
  ];
  const formatVal = formatValueOverride || ((val: string | number) => val);

  return (
    <Card className="shadow-none p-0 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <ChartContainer config={chartConfig} className="aspect-square max-h-[48px] min-h-[40px] w-[48px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent labelFormatter={(value: any, payload: any) =>
                    `${payload[0].name}: ${formatVal(payload[0].value)}`
                  } />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={10}
                outerRadius={18}
                strokeWidth={2}
              />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {icon}
            {title}
          </span>
          <span className="text-[13px] text-gray-500">
            Used: {formatVal(used)} / {formatVal(limit)}
          </span>
        </div>
      </div>
    </Card>
  );
}

const ResourceQuotaStats = ({ quota }: { quota: Record<string, any> }) => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(quota.status.hard).map((key) => {
          const type = getResourceType(key);
          const icon = resourceIconMap[type] || <HelpCircle className="w-4 h-4 text-gray-400" />;
          return (
            <ResourceQuotaPieStat
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              used={parseNumber(quota.status.used[key] || 0)}
              limit={parseNumber(quota.status.hard[key])}
              icon={icon}
              type={type}
              formatValueOverride={(val: string | number) => formatValue(val, type)}
            />
          );
        })}
      </div>
  );
};

export default ResourceQuotaStats; 