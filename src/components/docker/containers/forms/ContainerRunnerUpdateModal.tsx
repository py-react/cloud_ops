import React, { useState } from "react";
import { ContainerRunnerUpdate } from "./ContainerRunnerUpdate";
import { ContainerRunnerForm } from "./ContainerRunnerForm";
import { ContainerInfo, DockerConfig } from "@/gingerJs_api_client";

interface ContainerRunnerUpdateModalProps {
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  onSubmitHandler: (data: DockerConfig) => Promise<void>;
  editingContainer: ContainerInfo | null;
}

export function ContainerRunnerUpdateModal({
  isWizardOpen,
  setIsWizardOpen,
  onSubmitHandler,
  editingContainer,
}: ContainerRunnerUpdateModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // If we are editing, use the Update form (resource configuration)
  if (editingContainer) {
    return (
      <ContainerRunnerUpdate
        data={editingContainer as any}
        onSubmitHandler={onSubmitHandler}
        submitting={submitting}
        setSubmitting={setSubmitting}
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
      />
    );
  }

  // If we are not editing, use the Create form (full configuration)
  return (
    <ContainerRunnerForm
      onSubmitHandler={onSubmitHandler}
      submitting={submitting}
      setSubmitting={setSubmitting}
      isWizardOpen={isWizardOpen}
      setIsWizardOpen={setIsWizardOpen}
    />
  );
}
