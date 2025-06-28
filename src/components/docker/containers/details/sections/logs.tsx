import { ApiError, DefaultService } from '@/gingerJs_api_client';
import React, { useEffect, useState } from 'react'

const Logs = ({ container }: { container: any }) => {
  const [logs, setLogs] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await DefaultService.apiContainersPost({
          requestBody: {
            action: "logs",
            containerId: container.id,
          },
        });

        setLogs(response.logs);
      } catch (error) {
        if (error instanceof ApiError) {
          return error.body.message;
        }
        return error instanceof Error
          ? error.message
          : "Unknown error occurred";
      }
    })();
  }, []);

  return (
    <div>
      {["running", "exited", "paused"].includes(container.status) ? (
        <div className="text-sm text-gray-500 border-l-[0.5px] pl-6 border-gray-200">
          {logs?.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              <br />
            </span>
          ))}
        </div>
      ) : (
        `Container is not running`
      )}
    </div>
  );
};

export default Logs