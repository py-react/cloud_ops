import React from 'react';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { AlertCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GCPCredentialSelectorProps {
    disabled?: boolean;
}

export function GCPCredentialSelector({ disabled }: GCPCredentialSelectorProps) {
    const { gcpCredentials, selectedGcpCredential, setSelectedGcpCredential } = useGCP();

    if (gcpCredentials.length === 0) {
        return (
            <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No GCP credentials found</span>
            </div>
        );
    }

    return (
        <Select
            value={selectedGcpCredential ? String(selectedGcpCredential.id) : ""}
            onValueChange={(val) => setSelectedGcpCredential(parseInt(val))}
            disabled={disabled}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a GCP credential" />
            </SelectTrigger>
            <SelectContent>
                {gcpCredentials.map((cred) => (
                    <SelectItem key={cred.id} value={String(cred.id)}>
                        <span className="font-medium">{cred.name}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}