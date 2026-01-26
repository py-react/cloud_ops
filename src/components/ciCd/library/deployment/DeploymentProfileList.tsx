import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface DeploymentProfileListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const DeploymentProfileList: React.FC<DeploymentProfileListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails,
    onEdit,
    highlightedId,
    onRowClick
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        setFilteredProfiles(profiles.filter(profile =>
            profile.name.toLowerCase().includes(query) ||
            profile.type.toLowerCase().includes(query)
        ));
    }, [searchQuery, profiles]);

    return (
        <div className="flex-1 min-h-0">
            <ResourceTable
                className="pt-0"
                loading={loading}
                title="Deployment Specifications"
                description={`Manage reusable deployment-level specifications in ${selectedNamespace}.`}
                icon={<Settings className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "type", header: "Type" },
                ]}
                data={filteredProfiles}
                extraHeaderContent={
                    <Input
                        placeholder="Search by name or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-64"
                    />
                }
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
