import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

export type ResourceType = "pod" | "pod_profile" | "pod_metadata_profile" | "container" | "profile" | "deployment" | "deployment_profile" | "deployment_selector";

export const useResourceLink = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [highlightedId, setHighlightedId] = useState<string | number | null>(null);

    const focusId = searchParams.get("focusId");
    const resourceType = searchParams.get("resourceType") as ResourceType | null;
    const autoOpen = searchParams.get("autoOpen") === "true";

    useEffect(() => {
        if (focusId) {
            setHighlightedId(focusId);
            const timer = setTimeout(() => {
                setHighlightedId(null);
                // Optionally clear params from URL to prevent re-highlight on refresh if desired
                // const newParams = new URLSearchParams(searchParams);
                // newParams.delete("focusId");
                // newParams.delete("resourceType");
                // newParams.delete("autoOpen");
                // setSearchParams(newParams);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [focusId]);

    const setFocus = useCallback((id: string | number, type: ResourceType, open: boolean = false) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("focusId", String(id));
        newParams.set("resourceType", type);
        if (open) {
            newParams.set("autoOpen", "true");
        } else {
            newParams.delete("autoOpen");
        }
        setSearchParams(newParams);
    }, [searchParams, setSearchParams]);

    const clearFocus = useCallback(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("focusId");
        newParams.delete("resourceType");
        newParams.delete("autoOpen");
        setSearchParams(newParams);
        setHighlightedId(null);
    }, [searchParams, setSearchParams]);

    return {
        focusId,
        resourceType,
        autoOpen,
        highlightedId,
        setFocus,
        clearFocus
    };
};
