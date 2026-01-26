import React, { useState } from "react";
import { ContainerIcon } from "lucide-react";
import { ContainerRunnerUpdate } from "./ContainerRunnerUpdate";
import { Container } from "@/types/container";
import { DockerConfig } from "@/gingerJs_api_client";

interface ContainerRunnerUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DockerConfig) => Promise<void>;
  data: Container;
}

export function ContainerRunnerUpdateModal({
  open,
  onClose,
  onSubmit,
  data,
}: ContainerRunnerUpdateModalProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <ContainerRunnerUpdate
      data={data}
      onSubmitHandler={onSubmit}
      submitting={submitting}
      setSubmitting={setSubmitting}
      isWizardOpen={open}
      setIsWizardOpen={(val) => {
        if (!val) onClose();
      }}
    />
  );
}
