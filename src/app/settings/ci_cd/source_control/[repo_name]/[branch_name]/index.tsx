import React, { useContext, useEffect, useState } from "react";
import { SourceControlDetailedInfo } from "@/components/ciCd/sourceControl/details/sourceControl";
import { DefaultService } from "@/gingerJs_api_client";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const Page = () => {
  const { repo_name,branch_name } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const response = await DefaultService.apiIntegrationGithubBuildsGet({
      repoName: repo_name,
      branchName: branch_name,
    }).catch((err) => {
      toast.error(err.message);
    });
    if (!response) return;
    if (response.error) {
      setError(response.message);
      toast.error(response.message);
      return;
    }
    setData(response);
    return;
  };

  useEffect(() => {
    if (repo_name && branch_name) {
      (async () => {
        setIsLoading(true);
        await fetchData();
        setIsLoading(false);
      })();
    }
  }, [repo_name , branch_name]);
  return <SourceControlDetailedInfo name={repo_name} branch={branch_name} error={error} data={data} loading={isLoading} />;
};

export default Page;
