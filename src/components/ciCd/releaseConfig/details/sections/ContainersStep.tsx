import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ContainerIcon, TerminalIcon, Box, MemoryStick } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ContainersStepProps {
  containers: any[];
}

export const ContainersStep = ({ containers }: ContainersStepProps) => {
  if (!containers?.length) {
    return <div className="text-gray-500 p-6">No containers configured.</div>;
  }
  return (
    <>
      {containers.map((c, idx) => (
        <Card key={idx} className="shadow-none p-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-2">
              <ContainerIcon className="w-4 h-4 text-blue-500" />
              <CardTitle>Container: {c.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Command</span>
                </div>
                <div className="my-1 px-2 text-gray-500 break-words">
                  {c.command?.join(" ") || "-"}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Box className="w-3.5 h-3.5" />
                  <span>Args</span>
                </div>
                <div className="my-1 px-2 text-gray-500 break-words">
                  {c.args?.join(" ") || "-"}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MemoryStick className="w-3.5 h-3.5" />
                  <span>Env</span>
                </div>
                <div className="my-1 px-2 text-gray-500 break-words">
                  {c.env
                    ? c.env.map((e: any) => `${e.name}=${e.value}`).join(", ")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600">
                  <ContainerIcon className="w-3.5 h-3.5" />
                  <span>Ports</span>
                </div>
                <div className="my-1 px-2 text-gray-500 break-words">
                  {c.ports
                    ? c.ports
                        .map((p: any) => `${p.port}/${p.protocol}`)
                        .join(", ")
                    : "-"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MemoryStick className="w-3.5 h-3.5" />
                  <span>Resources</span>
                </div>
                <div className="my-1 px-2 text-gray-500 break-words">
                  {c.resources
                    ? `Req: ${JSON.stringify(
                        c.resources.requests || {}
                      )}, Lim: ${JSON.stringify(c.resources.limits || {})}`
                    : "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}; 