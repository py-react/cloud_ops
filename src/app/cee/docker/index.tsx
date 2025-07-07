import React, { useEffect, useState } from "react";
import useAutoRefresh from "@/components/docker/containers/hooks/useAutoRefresh"; 
import { Loader } from "lucide-react";
import SystemInfo from "@/components/docker/systemOverview/Overview";
import { DefaultService } from "@/gingerJs_api_client";

const fetchInfo = async () => {
  // Simulating an API call
  const data = await DefaultService.apiDockerSystemsPost({
    requestBody:{
      action:"info"
    }
  })
  return data.info
};

const ContainerListPage: React.FC = ({info}:any) => {
    const [systemInfo, setSystemInfo] = useState<any>(info);

  const {
    data,
    isFetching,
    error,
  } = useAutoRefresh(fetchInfo, 1500);

  useEffect(() => {
    if (data) {
        setSystemInfo(data);
    }
  }, [data]);


  return (
    <div key="overview" className="w-full">
          <div className="mb-2 flex items-center w-full gap-2 h-4 text-sm">
            {isFetching && (
              <>
                <Loader className="w-3.5 h-3.5" />
                <span>Refreshing</span>
              </>
            )}
          </div>
            {systemInfo && (
              <SystemInfo systemInfo={systemInfo} />
            )}
        </div>
  );
};

export default ContainerListPage;
