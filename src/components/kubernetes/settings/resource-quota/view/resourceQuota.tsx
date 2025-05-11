import React from "react";
import { cn } from "@/libs/utils";

interface ResourceDetailProps {
    title: string;
    used: number;
    limit: number;
    icon: React.ReactNode;
  }
  
  export const ResourceQuota = ({
    title,
    used,
    limit,
    icon,
  }: ResourceDetailProps) => {
  
    const usedValue = used;
    const limitValue =limit;
    
    // Calculate percentage, cap at 100%
    const percentUsed = limitValue > 0 ? Math.min((usedValue / limitValue) * 100, 100) : 0;
    
    // Determine status color based on percentage
    let statusColor = "bg-green-500";
    let textColor = "text-green-500";
    
    if (percentUsed > 80) {
      statusColor = "bg-red-500";
      textColor = "text-red-500";
    } else if (percentUsed > 50) {
      statusColor = "bg-amber-500";
      textColor = "text-amber-500";
    }
  
    return (
      <div className="flex flex-col space-y-2 py-2 border-b last:border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className={textColor}>{used}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span>{limit}</span>
          </div>
        </div>
        
        {/* Percentage bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={cn("h-2.5 rounded-full", statusColor)} 
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>
      </div>
    );
  };
  

  export default ResourceQuota