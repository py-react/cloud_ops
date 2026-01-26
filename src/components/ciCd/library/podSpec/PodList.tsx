import React from "react";
import { Box, ExternalLink } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface PodListProps {
    pods: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const PodList: React.FC<PodListProps> = ({
    pods,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails,
    highlightedId,
    onRowClick
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
                        cell: (row: any) => (
                            <div
                                className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const ids = row.containers || [];
                                    const url = `/settings/ci_cd/library/${selectedNamespace}/spec/container?focusId=${ids.join(',')}&resourceType=container&autoOpen=false`;
                                    window.open(url, "_blank");
                                }}
                            >
                                <span className="font-mono font-bold">{row.containers?.length || 0}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </div>
                        )
                    },
                ]}
                loading={loading}
                data={pods}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
