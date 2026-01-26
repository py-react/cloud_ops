import React from "react";
import { ProfileList } from "../ProfileList";

interface ViewProfileListProps {
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

export const ViewProfileList: React.FC<ViewProfileListProps> = ({
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
    return (
        <div className="h-full">
            <ProfileList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                type={type}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};
