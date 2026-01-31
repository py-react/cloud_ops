import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Layers } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface DeploymentListProps {
    deployments: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const DeploymentList: React.FC<DeploymentListProps> = ({
    deployments,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails,
    onEdit,
    highlightedId,
    onRowClick
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredDeployments, setFilteredDeployments] = useState<any[]>([]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        setFilteredDeployments(deployments.filter(deployment =>
            deployment.name.toLowerCase().includes(query)
        ));
    }, [searchQuery, deployments]);

    return (
        <div className="flex-1 min-h-0 mt-6">
            <ResourceTable
                className="pt-0"
                loading={loading}
                title="Derived Deployments"
                description={`Manage composed deployment configurations in ${selectedNamespace}.`}
                icon={<Layers className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "namespace", header: "Namespace" },
                    { accessor: "replicas", header: "Replicas" },
                ]}
                data={filteredDeployments}
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
