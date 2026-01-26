import React from "react";
import { ContainerSpecList } from "@/components/ciCd/library/containerSpec/ContainerSpecList";

interface ViewSpecListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
    control?: any;
    setValue?: any;
    watch?: any;
    form?: any;
}

export const ViewSpecList: React.FC<ViewSpecListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete,
    onViewDetails,
    onEdit,
    highlightedId,
    onRowClick
}) => {
    return (
        <div className="h-full">
            <ContainerSpecList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
