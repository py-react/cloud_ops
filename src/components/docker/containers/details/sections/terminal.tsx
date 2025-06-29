import React from "react";
import { ApiError, DefaultService, RunContainer } from "@/gingerJs_api_client";
import { ReactTerminal, TerminalContextProvider } from "react-terminal";

const Terminal = ({
  container,
  currentPath,
}: {
  container: any;
  currentPath: string;
}) => {
  return (
    <div
      className={`h-[calc(100vh-19.5rem)] pl-6 border-l-[0.5px] border-gray-200`}
    >
      {["running"].includes(container.status) ? (
        <TerminalContextProvider>
          <ReactTerminal
            defaultHandler={async (...cmd: string[]) => {
              try {
                console.log({ cmd });
                const response = await DefaultService.apiDockerContainersPost({
                  requestBody: {
                    action: "command" as RunContainer["action"],
                    containerId: container.id,
                    dir: {
                      directory: currentPath,
                      command: cmd.join(" "),
                    },
                  },
                });
                return response.output;
              } catch (error) {
                if (error instanceof ApiError) {
                  return error.body.message;
                }
                return error instanceof Error
                  ? error.message
                  : "Unknown error occurred";
              }
            }}
            prompt=">>"
            showControlBar={false}
            showControlButtons={false}
            themes={{
              "light-theme": {
                themeBGColor: "rgb(255 255 255 / 1)",
                themeToolbarColor: "rgb(0 0 0 / 1)",
                themeColor: "rgb(0 0 0 / 1)",
                themePromptColor: "rgb(0 0 0 / 1)",
              },
              "dark-theme": {
                themeBGColor: "rgb(0 0 0 / 1)",
                themeToolbarColor: "rgb(255 255 255 / 1)",
                themeColor: "rgb(255 255 255 / 1)",
                themePromptColor: "rgb(255 255 255 / 1)"

              },
            }}
            theme="light-theme"
          />
        </TerminalContextProvider>
      ) : (
        `Container is not running`
      )}
    </div>
  );
};

export default Terminal;
