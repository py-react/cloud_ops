import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/libs/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

type DataValue = string | number | boolean | null | DataObject | DataArray;
type DataObject = { [key: string]: DataValue };
type DataArray = DataValue[];

interface SmartDataViewerProps {
  data: DataValue;
  label?: string;
  level?: number;
  initiallyOpen?: boolean;
}

const SmartDataViewer: React.FC<SmartDataViewerProps> = ({
  data,
  label,
  level = 0,
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(initiallyOpen);

  const renderValue = (value: DataValue, itemLabel?: string): JSX.Element => {
    if (typeof value === "string") {
      return <span className="text-green-700">{value}</span>;
    } else if (typeof value === "number") {
      return <span className="text-blue-700">{value}</span>;
    } else if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    } else if (value === null) {
      return <span className="text-gray-500 italic">Not provided</span>;
    } else if (Array.isArray(value)) {
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">
              {itemLabel} ({value.length} items)
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-4 border-l border-gray-300 mt-1">
              {value.map((item, index) => (
                <div key={index} className="mt-1">
                  <SmartDataViewer
                    data={item}
                    label={`Item ${index + 1}`}
                    level={level + 1}
                    initiallyOpen={initiallyOpen}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    } else if (typeof value === "object") {
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-semibold text-gray-700">{itemLabel}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-4 border-l border-gray-300 mt-1">
              {Object.entries(value).map(([key, val]) => (
                <div key={key} className="mt-1">
                  <SmartDataViewer
                    data={val}
                    label={key}
                    level={level + 1}
                    initiallyOpen={initiallyOpen}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    return <span>Unknown Type</span>;
  };

  return (
    <div className={cn("text-sm", level === 0 && "p-0")}>
      {((label && !Array.isArray(data) && typeof data !== "object") ||
        !data) && (
        <span className="font-semibold text-gray-700">{label}: </span>
      )}
      {renderValue(data, label)}
    </div>
  );
};

export default SmartDataViewer;
