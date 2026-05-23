import React,{ useEffect, useState } from "react";
import { DefaultService } from "@/gingerJs_api_client";



export const useKubernertesResources = ({
  nameSpace,
  type,
  fieldSelector,
  labelSelector,
  apiVersion,
}: {
  nameSpace: string;
  type: string;
  fieldSelector?: string;
  labelSelector?: string;
  apiVersion?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [resource, setResource] = useState([] as Record<string, any>[]);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [isRefetched, setIsRefetched] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  const fetchResource = async () => {
    if (!type) return;
    setIsLoading(true);
    setError(null);
    setIsConfigMissing(false);
    try {
      // Pass namespace only if it's a non-empty string; undefined = cluster-wide
      const response = await DefaultService.apiKubernertesResourcesTypeGet({
        namespace: nameSpace || undefined,
        type,
        fieldSelector,
        labelSelector,
        apiVersion,
      });
      if (Array.isArray(response)) {
        setResource(response);
        setIsFetched(true);
      } else if (response && (response as any).error) {
        throw new Error((response as any).error);
      } else {
        throw new Error("Failed to fetch resources: Invalid response format");
      }
    } catch (err: any) {
      let message = "An error occurred";
      if (err.body && err.body.error) {
        message = err.body.error;
        if (err.body.is_active_config_missing) {
          setIsConfigMissing(true);
        }
      } else if (err.message) {
        message = err.message;
        if (message.includes("No active Kubernetes configuration found")) {
          setIsConfigMissing(true);
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    setIsRefetching(true);
    fetchResource().then(() => {
      setIsRefetching(false);
      setIsRefetched(true);
    });
  };

  useEffect(() => {
    fetchResource();
  }, [nameSpace, type]);

  return {
    resource,
    error,
    isLoading,
    isRefetching,
    isFetched,
    isRefetched,
    isConfigMissing,
    refetch,
  };
};

export default useKubernertesResources;