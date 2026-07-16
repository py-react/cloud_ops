import React, { useContext, useState } from "react";
import { DockerEngineContext } from "./contextProvider/DockerEngineContext";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Server } from "lucide-react";
import { cn } from "@/libs/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DockerEngineSelectorProps {
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient" | "glow" | "subtle";
  className?: string;
}

export function DockerEngineSelector({ size = "default", variant = "outline", className }: DockerEngineSelectorProps) {
  const {
    engines,
    activeEngineId,
    setActiveEngineId,
  } = useContext(DockerEngineContext);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEngines = React.useMemo(() => {
    return (engines || []).filter(engine =>
      engine?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [engines, searchTerm]);

  const activeEngine = engines.find(e => e.id === activeEngineId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          size={size}
          className={cn("w-[240px] justify-between rounded-[0.5rem] bg-white border border-border/50 shadow-sm", className)}
        >
          <div className="flex items-center gap-2 truncate">
            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-black">
              {activeEngine ? activeEngine.name : "Select Engine..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search engine..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty>No engines found</CommandEmpty>
            <CommandGroup heading="Configured Docker Engines">
              {filteredEngines.map((engine) => (
                <CommandItem
                  key={engine.id}
                  value={engine.name}
                  onSelect={() => {
                    setActiveEngineId(engine.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium text-xs">
                    {engine.name} {engine.id === 0 && "(Local)"}
                  </span>
                  {activeEngineId === engine.id && (
                    <Check className="h-4 w-4 ml-auto text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
