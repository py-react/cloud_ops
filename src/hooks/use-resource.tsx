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

  const fetchResource = async () => {
    if (!nameSpace && !type) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await DefaultService.apiKubernertesResourcesTypeGet({
        namespace: nameSpace,
        type,
        fieldSelector,
        labelSelector,
        apiVersion,
      });
      if (response) {
        setResource(response as Record<string, any>[]);
        setIsFetched(true);
      } else {
        throw new Error("Failed to fetch resources");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
    refetch,
  };
};

export default useKubernertesResources;