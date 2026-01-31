import React from "react";
import { Container } from "lucide-react";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

interface DerivedContainerListProps {
    profiles: any[];
    loading: boolean;
    selectedNamespace: string;
    onDelete?: (row: any, dependents?: any[]) => void;
    onViewDetails?: (row: any) => void;
    onEdit?: (row: any) => void;
    highlightedId?: string | number | null;
    onRowClick?: (row: any) => void;
}

export const DerivedContainerList: React.FC<DerivedContainerListProps> = ({
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
        <div className="flex-1 min-h-0 mt-4">
            <ResourceTable
                title="Derived Containers"
                description={`Defined derived container configurations for deployments in ${selectedNamespace}.`}
                icon={<Container className="h-5 w-5" />}
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "description", header: "Description" },
                    { accessor: "namespace", header: "Namespace" },
                    { accessor: "command", header: "Command" },
                    { accessor: "args", header: "Args" },
                ]}
                loading={loading}
                data={profiles.map(profile => ({
                    ...profile,
                    args: <Chips list={Array.isArray(profile.args) ? profile.args : []} />,
                    command: <Chips list={Array.isArray(profile.command) ? profile.command : []} />,
                }))}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                highlightedId={highlightedId}
                onRowClick={onRowClick}
            />
        </div>
    );
};


const Chips = ({ list }: { list: string[] }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {list.map((item: string, index: number) => (
                <span
                    key={index}
                    className="pl-3 pr-2 py-1.5 gap-2 text-primary transition-all group font-mono bg-primary/10 rounded-md text-xs font-semibold"
                >
                    {item}
                </span>
            ))}
        </div>
    )
}