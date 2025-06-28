import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";

export interface ServicePortsStepProps {
  service_ports: any[];
}

export const ServicePortsStep = ({ service_ports }:ServicePortsStepProps) => {
  if (!service_ports?.length) {
    return <div className="text-gray-500 p-6">No service ports configured.</div>;
  }
  return (
    <div>
      {service_ports.map((p, idx) => (
        <Card key={idx} className="shadow-none p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 gap-4 text-sm items-center">
              <div className="flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-blue-500" />
                <span>Port:</span> {p.port}
              </div>
              <div><span className="font-semibold">Target Port:</span> {p.target_port}</div>
              <div><span className="font-semibold">Protocol:</span> {p.protocol}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 