import React, { useContext, useEffect, useState } from "react";
import { KubeContext } from "./context/KubeContext";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  Check, 
  ChevronsUpDown,
} from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function KubeContextSwitcher() {
  const {
    isLoading: isKubeContextLoading,
    config: kubeConfig,
    setCurrentKubeContext,
    currentKubeContext
  } = useContext(KubeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [contexts, setContexts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contexts based on search term
  const filteredContexts = contexts.filter(context => 
    context.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    context.clusterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    context.namespace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const switchContext = (contextData) => {
    
    setCurrentKubeContext({
      context: {
        cluster: contextData.clusterName,
        user: contextData.userName,
        namespace:contextData.namespace
      },
      name: contextData.name,
    });
    setIsOpen(false);
    
    toast.success(`Switched to context "${contextData.name}"`);
  };


  useEffect(() => {
    if (!isKubeContextLoading && kubeConfig) setContexts(kubeConfig);
  }, [kubeConfig, isKubeContextLoading]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[260px] justify-between rounded-[0.5rem]"
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentKubeContext?.name ? currentKubeContext.name : "Select context"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search context..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No contexts found</CommandEmpty>
            <CommandGroup heading="Available Contexts">
              {filteredContexts.map((context) => (
                <CommandItem
                  key={context.name}
                  value={context.name}
                  onSelect={() => switchContext(context)}
                  className="flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" />
                  <span className="flex-1 truncate">{context.name}</span>
                  {currentKubeContext?.name === context.name  && (
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
