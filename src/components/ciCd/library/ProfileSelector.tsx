import React, { useEffect, useState } from "react";
import { DefaultService } from "@/gingerJs_api_client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Profile {
    id: number;
    name: string;
    namespace: string;
    description?: string;
}

interface ProfileSelectorProps {
    profileType: "container" | "pod_profile" | "pod_metadata_profile";
    namespace: string;
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    multiple?: boolean;
    label?: string;
}

const API_ENDPOINTS = {
    container: "/api/integration/kubernetes/library/container",
    pod_profile: "/api/integration/kubernetes/library/pod_profile",
    pod_metadata_profile: "/api/integration/kubernetes/library/pod_metadata_profile",
};

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    profileType,
    namespace,
    selectedIds,
    onChange,
    multiple = true,
    label,
}) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${API_ENDPOINTS[profileType]}?namespace=${namespace}`
                );
                const data = await response.json();
                setProfiles(data);
            } catch (error) {
                console.error(`Error fetching ${profileType} profiles:`, error);
            } finally {
                setLoading(false);
            }
        };

        if (namespace) {
            fetchProfiles();
        }
    }, [profileType, namespace]);

    const selectedProfiles = profiles.filter((p) => selectedIds.includes(p.id));

    const handleSelect = (profileId: string) => {
        const id = parseInt(profileId);
        if (multiple) {
            if (selectedIds.includes(id)) {
                onChange(selectedIds.filter((i) => i !== id));
            } else {
                onChange([...selectedIds, id]);
            }
        } else {
            onChange([id]);
        }
    };

    const handleRemove = (id: number) => {
        onChange(selectedIds.filter((i) => i !== id));
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label}</label>}

            {/* Selected profiles */}
            {selectedProfiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedProfiles.map((profile) => (
                        <Badge key={profile.id} variant="secondary" className="gap-1">
                            {profile.name}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleRemove(profile.id)}
                            />
                        </Badge>
                    ))}
                </div>
            )}

            {/* Selector */}
            <Select onValueChange={handleSelect} disabled={loading}>
                <SelectTrigger>
                    <SelectValue
                        placeholder={
                            loading
                                ? "Loading..."
                                : `Select ${profileType} profile${multiple ? "s" : ""}`
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {profiles
                        .filter((p) => !selectedIds.includes(p.id))
                        .map((profile) => (
                            <SelectItem key={profile.id} value={profile.id.toString()}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{profile.name}</span>
                                    {profile.description && (
                                        <span className="text-xs text-muted-foreground">
                                            {profile.description}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    {profiles.length === 0 && !loading && (
                        <SelectItem value="none" disabled>
                            No profiles available
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
