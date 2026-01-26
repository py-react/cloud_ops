import React, { useEffect, useContext, useState } from "react";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { 
  Check, 
  ChevronsUpDown,
  Folder,
  Info,
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

export function ProfileSelector({onSelectProfile,selectedProfile}) {
const { selectedNamespace } = useContext(NamespaceContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/integration/kubernetes/library/profile?namespace=${selectedNamespace}`);
            const data = await response.json();
            setProfiles(data);
        } finally {
            setLoading(false);
        }
    };

  const handleProfileChange = (profileValue) => {
    onSelectProfile(profileValue);
  };

  // Filter profiles based on search term
  const filteredProfiles = profiles
    .filter(profileValue => 
      profileValue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profileValue.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${profileValue.name} (${profileValue.type})`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useEffect(() => { fetchProfiles(); }, [selectedNamespace]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between rounded-[0.5rem]"
        >
          <div className="flex items-center gap-2 truncate">
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {Object.keys(selectedProfile).length ? `${selectedProfile.name} (${selectedProfile.type})` : "None selected"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search namespace..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No namespaces found</CommandEmpty>
            <CommandGroup heading="Available Namespaces">
              {filteredProfiles.map((profileValue) => (
                <CommandItem
                  key={profileValue.id}
                  value={profileValue.id}
                  onSelect={() => handleProfileChange(profileValue)}
                  className="flex items-center gap-2 text-base"
                >
                  <Info className="h-5 w-5" />
                  <span className="flex-1 truncate">{`${profileValue.name} (${profileValue.type})`}</span>
                  {profileValue.id === selectedProfile.id && (
                    <Check className="h-5 w-5 ml-auto text-primary" />
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
