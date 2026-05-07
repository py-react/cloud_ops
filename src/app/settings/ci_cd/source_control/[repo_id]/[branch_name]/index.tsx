import React, { useContext, useEffect, useState } from "react";
import { SourceControlDetailedInfo } from "@/components/ciCd/sourceControl/details/sourceControl";
import { DefaultService } from "@/gingerJs_api_client";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const Page = () => {
  const { repo_id,branch_name } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState<any[] | null>(null);
  const [repoName, setRepoName] = useState(repo_id);

  const fetchData = async () => {
    const response = await DefaultService.apiIntegrationGithubBuildsGet({
      repoName: repo_id,
      branchName: branch_name,
    }).catch((err) => {
      toast.error(err.message);
    });
    if (!response) return;
    
    // The response is now an array of builds
    const result = response as any[];
    if ((result as any).error) {
      setError((result as any).message);
      toast.error((result as any).message);
      return;
    }
    setData(result);
    if (result.length > 0 && result[0].repo_name_full_name) {
      setRepoName(result[0].repo_name_full_name);
    }
    return;
  };

  useEffect(() => {
    if (repo_id && branch_name) {
      (async () => {
        setIsLoading(true);
        await fetchData();
        setIsLoading(false);
      })();
    }
  }, [repo_id , branch_name]);
  return <SourceControlDetailedInfo name={repoName} branch={branch_name} error={error} data={data as any[]} loading={isLoading} />;
};

export default Page;
