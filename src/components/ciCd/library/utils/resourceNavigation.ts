import { ResourceType } from "@/hooks/useResourceLink";

/**
 * Builds the correct URL path for a given resource type and opens it in a new tab
 * @param id - The resource ID to focus on
 * @param resourceType - The type of resource (pod, pod_profile, pod_metadata_profile, container, profile)
 * @param namespace - Optional namespace, will be extracted from current path if not provided
 * @param autoOpen - Whether to auto-open the details dialog (default: true)
 */
export function buildResourceUrl(
    id: number | string,
    resourceType: ResourceType,
    namespace?: string,
    autoOpen: boolean = true
): string {
    // Extract namespace from current path if not provided
    if (!namespace) {
        const pathParts = window.location.pathname.split('/');
        const namespaceIndex = pathParts.findIndex(part => part === 'library') + 1;
        namespace = pathParts[namespaceIndex] || 'default';
    }

    // Build the correct path based on resource type
    let targetPath = '';
    switch (resourceType) {
        case 'pod_profile':
            targetPath = `/settings/ci_cd/library/${namespace}/spec/pod/profile`;
            break;
        case 'pod_metadata_profile':
            targetPath = `/settings/ci_cd/library/${namespace}/spec/pod/metadata`;
            break;
        case 'profile':
            targetPath = `/settings/ci_cd/library/${namespace}/spec/container/profile`;
            break;
        case 'container':
            targetPath = `/settings/ci_cd/library/${namespace}/spec/container`;
            break;
        case 'pod':
            targetPath = `/settings/ci_cd/library/${namespace}/spec/pod`;
            break;
        default:
            targetPath = window.location.pathname;
    }

    return `${targetPath}?focusId=${id}&resourceType=${resourceType}${autoOpen ? '&autoOpen=true' : ''}`;
}

/**
 * Opens a resource in a new tab with the correct URL
 * @param id - The resource ID to focus on
 * @param resourceType - The type of resource
 * @param namespace - Optional namespace
 * @param autoOpen - Whether to auto-open the details dialog (default: true)
 */
export function openResourceInNewTab(
    id: number | string,
    resourceType: ResourceType,
    namespace?: string,
    autoOpen: boolean = true
): void {
    const url = buildResourceUrl(id, resourceType, namespace, autoOpen);
    window.open(url, "_blank");
}
