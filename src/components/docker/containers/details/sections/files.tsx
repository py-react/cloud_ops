import React, { useState } from 'react'
import { FileExplorer } from '../../common/file-explorer/FileExplorer';

const Files = ({
  container,
  setActiveTab,
  setCurrentPath,
  currentPath,
}: {
  container: any;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPath: React.Dispatch<React.SetStateAction<string>>;
  currentPath: string;
}) => {
  return (
    <>
      {["running"].includes(container.status) ? (
        <div className="col-span-2rounded-lg">
          <div className="h-[calc(100vh-19.5rem)]">
            <FileExplorer
              containerId={container.id}
              currentPath={currentPath}
              attachTerminalToPath={(
                action: "attach" | "set",
                path?: string
              ) => {
                if (path) {
                  setCurrentPath(path);
                }
                if (action == "attach") {
                  setActiveTab("terminal");
                  return;
                }
              }}
            />
          </div>
        </div>
      ) : (
        `Container is not running`
      )}
    </>
  );
};

export default Files