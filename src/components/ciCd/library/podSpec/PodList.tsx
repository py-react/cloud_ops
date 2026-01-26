import React from "react";
import { Box } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface PodListProps {
    pods: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any) => void;
    onViewDetails?: (row: any) => void;
}

export const PodList: React.FC<PodListProps> = ({
    pods,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails
}) => {
    return (
        <div className="flex-1 min-h-0 mt-10">
            <ResourceTable
                title="Pod Specifications"
                description={`Defined pod configurations for deployments in ${selectedNamespace}.`}
                icon={<Box className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "namespace", header: "Namespace" },
                    {
                        accessor: "containers",
                        header: "Containers",
                        cell: (row: any) => row.containers?.length || 0
                    },
                ]}
                loading={loading}
                data={pods}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
            />
        </div>
    );
};
