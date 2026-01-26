import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SquareTerminal } from "lucide-react";
import { toast } from "sonner";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { DefaultService } from "@/gingerJs_api_client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContainerSpecListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const ContainerSpecList: React.FC<ContainerSpecListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete,
    highlightedId,
    onRowClick
}) => {
    const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (selectedType) {
            setFilteredProfiles(profiles.filter(profile => profile.type === selectedType));
        } else {
            setFilteredProfiles(profiles);
        }
    }, [selectedType, profiles]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        let filtered = selectedType ? profiles.filter(p => p.type === selectedType) : profiles;
        filtered = filtered.filter(profile =>
            profile.name.toLowerCase().includes(query) ||
            profile.type.toLowerCase().includes(query)
        );
        setFilteredProfiles(filtered);
    }, [searchQuery, selectedType, profiles]);

    const handleDelete = (row: any) => {
        DefaultService.apiIntegrationKubernetesLibraryProfileDelete({ id: row.id })
            .then(res => {
                toast.success(`deleted ${row.name} (${row.type})`)
                onDelete?.(row);
            })
            .catch(error => {
                if (error.status === 409) {
                    const dependents = error.body?.detail?.dependents || error.body?.dependents || [];
                    onDelete?.(row, dependents);
                } else {
                    toast.error(`Unable to delete ${row.name}`);
                }
            });
    };

    return (
        <div className="flex-1 min-h-0">
            <ResourceTable
                className="pt-0"
                loading={loading}
                title="Container Spec"
                description={`Define the container spec for containers for traceability across deployments in ${selectedNamespace}.`}
                icon={<SquareTerminal className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "type", header: "Type" },
                ]}
                data={filteredProfiles}
                extraHeaderContent={
                    <div className="flex items-center gap-3">
                        <Input
                            placeholder="Search by name or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-56"
                        />
                        <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? null : value)}>
                            <SelectTrigger className="w-48 h-9">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types ({profiles.length})</SelectItem>
                                {[...Array.from(new Set(profiles.map(p => p.type)))].map((type) => (
                                    <SelectItem key={type} value={type as string}>
                                        {type} ({profiles.filter(p => p.type === type).length})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
                onDelete={handleDelete}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
