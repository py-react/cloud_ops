import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Layout, Settings, X, Search } from "lucide-react";
import { toast } from "sonner";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DefaultService } from "@/gingerJs_api_client";

interface ProfileListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    type: "pod_profile" | "pod_metadata_profile";
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const ProfileList: React.FC<ProfileListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails,
    onEdit,
    type,
    highlightedId,
    onRowClick
}) => {
    const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        let filtered = selectedType ? profiles.filter(p => p.type === selectedType) : profiles;
        filtered = filtered.filter(profile =>
            profile.name.toLowerCase().includes(query) ||
            profile.type.toLowerCase().includes(query)
        );
        setFilteredProfiles(filtered);
    }, [searchQuery, selectedType, profiles]);

    const handleDelete = async (row: any) => {
        try {
            if (type === "pod_profile") {
                await DefaultService.apiIntegrationKubernetesLibraryPodProfileDelete({ id: row.id });
            } else {
                await DefaultService.apiIntegrationKubernetesLibraryPodMetadataProfileDelete({ id: row.id });
            }
            toast.success(`Deleted ${row.name}`);
            onDelete?.(row);
        } catch (error: any) {
            if (error.status === 409) {
                // Robust parsing of the error body
                const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                onDelete?.(row, dependents);
            } else {
                toast.error("Error deleting profile");
            }
        }
    };

    const title = type === "pod_profile" ? "Pod Profiles" : "Metadata Profiles";
    const Icon = type === "pod_profile" ? Settings : Layout;

    return (
        <div className="flex-1 min-h-0">
            <ResourceTable
                className="pt-0"
                loading={loading}
                title={title}
                description={`List of configured ${title.toLowerCase()} for ${selectedNamespace}.`}
                icon={<Icon className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "type", header: "Type" },
                ]}
                data={filteredProfiles}
                extraHeaderContent={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-56 pl-9"
                            />
                        </div>
                        <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? null : value)}>
                            <SelectTrigger className="w-48 h-9">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types ({profiles.length})</SelectItem>
                                {[...Array.from(new Set(profiles.map(p => p.type)))].map((t) => (
                                    <SelectItem key={t as string} value={t as string}>
                                        {t as string} ({profiles.filter(p => p.type === t).length})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
                onDelete={handleDelete}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
