import React from "react";
import { ContainerSpecList } from "@/components/ciCd/library/containerSpec/ContainerSpecList";

interface ViewSpecListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: () => void;
    control?: any;
    setValue?: any;
    watch?: any;
    form?: any;
}

export const ViewSpecList: React.FC<ViewSpecListProps> = ({ 
    profiles, 
    loading, 
    selectedNamespace,
    onDelete
}) => {
    return (
        <div className="h-full">
            <ContainerSpecList 
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={onDelete}
            />
        </div>
    );
};
