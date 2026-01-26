import React from "react";
import { DerivedContainerList } from "@/components/ciCd/library/derivedContainer/DerivedContainerList";

interface ViewDerivedContainerListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: () => void;
    control?: any;
    setValue?: any;
    watch?: any;
    form?: any;
}

export const ViewDerivedContainerList: React.FC<ViewDerivedContainerListProps> = ({
    profiles,
    loading,
    selectedNamespace,
    onDelete
}) => {
    return (
        <div className="h-full">
            <DerivedContainerList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={onDelete}
            />
        </div>
    );
};
