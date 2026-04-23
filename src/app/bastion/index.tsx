import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function BastionIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/bastion/systems");
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center bg-[#0d1117]">
      <Loader2 className="animate-spin text-[#1f6feb]" size={32} />
    </div>
  );
}
