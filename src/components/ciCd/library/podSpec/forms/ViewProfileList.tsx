import React from "react";
import { ProfileList } from "../ProfileList";

interface ViewProfileListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: () => void;
    type: "pod_profile" | "pod_metadata_profile";
}

export const ViewProfileList: React.FC<ViewProfileListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete,
    type
}) => {
    return (
        <div className="h-full">
            <ProfileList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={onDelete}
                type={type}
            />
        </div>
    );
};
