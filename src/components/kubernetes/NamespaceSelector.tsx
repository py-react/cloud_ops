import React, { useEffect, useContext, useState } from "react";
import { NamespaceContext } from "./context/NamespaceContext";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { 
  Check, 
  ChevronsUpDown,
  Folder,
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

interface Namespace {
  metadata: {
    name: string;
  };
}

export function NamespaceSelector() {
  const {
    isLoading,
    namespaces,
    fetchNamespaces,
    setSelectedNamespace,
    selectedNamespace,
  } = useContext(NamespaceContext);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (namespaces.length === 0 && !isLoading) {
      fetchNamespaces();
    }
  }, [isLoading, namespaces]);

  // Filter namespaces based on search term
  const filteredNamespaces = ([{ metadata: { name: "All" } }] as Namespace[])
    .concat(namespaces || [])
    .filter(namespace => 
      namespace.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleNamespaceChange = (namespaceName: string) => {
    if (namespaceName === "All") {
      setSelectedNamespace("");
    } else {
      setSelectedNamespace(namespaceName);
    }
    setIsOpen(false);
    toast.success(`Switched to namespace "${namespaceName}"`);
  };

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
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedNamespace ? selectedNamespace : "All namespaces"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search namespace..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No namespaces found</CommandEmpty>
            <CommandGroup heading="Available Namespaces">
              {filteredNamespaces.map((namespace) => (
                <CommandItem
                  key={namespace.metadata.name}
                  value={namespace.metadata.name}
                  onSelect={() => handleNamespaceChange(namespace.metadata.name)}
                  className="flex items-center gap-2"
                >
                  <Folder className="h-4 w-4" />
                  <span className="flex-1 truncate">{namespace.metadata.name}</span>
                  {selectedNamespace === namespace.metadata.name && (
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
