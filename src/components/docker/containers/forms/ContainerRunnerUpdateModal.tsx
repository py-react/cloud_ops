import React, { useState } from "react";
import { ContainerIcon, X } from "lucide-react";
import { ContainerRunConfig } from "./types";
import { ContainerRunnerUpdate } from "./ContainerRunnerUpdate";
import { Container } from "@/types/container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0">
        <DialogHeader className="py-4 px-6 border-b flex !flex-row items-center">
          <DialogTitle className="flex items-center gap-2 w-full px-6">
            <ContainerIcon className="h-5 w-5" />
            Container Configuration
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-[calc(100vh-8rem)] px-6">
          <ContainerRunnerUpdate
            data={data}
            onSubmitHandler={onSubmit}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
