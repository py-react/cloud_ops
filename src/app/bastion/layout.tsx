import React from "react";
import { Outlet } from "react-router-dom";
import { TerminalProvider } from "@/components/bastion/TerminalContext";

export default function BastionLayout() {
  return (
    <TerminalProvider>
      <div className="w-full h-full overflow-hidden flex flex-col">
        <Outlet />
      </div>
    </TerminalProvider>
  );
}
