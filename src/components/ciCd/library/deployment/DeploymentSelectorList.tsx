import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Layout } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface DeploymentSelectorListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const DeploymentSelectorList: React.FC<DeploymentSelectorListProps> = ({
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
            profile.name.toLowerCase().includes(query)
        ));
    }, [searchQuery, profiles]);

    return (
        <div className="flex-1 min-h-0 mt-6">
            <ResourceTable
                className="pt-0"
                loading={loading}
                title="Deployment Selectors"
                description={`Manage reusable deployment label selectors in ${selectedNamespace}.`}
                icon={<Layout className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "namespace", header: "Namespace" },
                ]}
                data={filteredProfiles}
                extraHeaderContent={
                    <Input
                        placeholder="Search by name..."
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
