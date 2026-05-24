import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { getAuthToken } from '@/libs/auth';

export function AWSRegionSelector() {
    const { selectedRegion, setSelectedRegion, availableRegions, setAvailableRegions, selectedAwsCredential } = useAWS();

    useEffect(() => {
        if (!selectedAwsCredential?.id) return;
        const token = getAuthToken();
        fetch(`/api/v1/aws/meta?credential_id=${selectedAwsCredential.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.regions) setAvailableRegions(d.regions); })
            .catch(() => {});
    }, [selectedAwsCredential?.id]);

    const currentLabel = availableRegions.find(r => r.value === selectedRegion)?.label || selectedRegion;

    return (
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-9 w-[180px] text-xs font-bold border-dashed">
                <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <SelectValue placeholder={currentLabel}>{currentLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border-border/50 max-h-72">
                {availableRegions.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                        <span className="font-mono text-xs">{r.value}</span>
                        <span className="text-muted-foreground ml-2 text-[11px]">{r.label}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
