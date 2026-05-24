import React from 'react';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { AlertCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AWSCredentialSelectorProps {
    disabled?: boolean;
}

export function AWSCredentialSelector({ disabled }: AWSCredentialSelectorProps) {
    const { awsCredentials, selectedAwsCredential, setSelectedAwsCredential } = useAWS();

    if (awsCredentials.length === 0) {
        return (
            <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No AWS credentials found</span>
            </div>
        );
    }

    return (
        <Select
            value={selectedAwsCredential ? String(selectedAwsCredential.id) : ""}
            onValueChange={(val) => setSelectedAwsCredential(parseInt(val))}
            disabled={disabled}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select an AWS credential" />
            </SelectTrigger>
            <SelectContent>
                {awsCredentials.map((cred) => (
                    <SelectItem key={cred.id} value={String(cred.id)}>
                        <span className="font-medium">{cred.name}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
