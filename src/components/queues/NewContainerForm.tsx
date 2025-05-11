import React, { useState } from 'react'
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QueueConfigModal } from './QueueConfig'
import { DefaultService } from "@/gingerJs_api_client";

interface QueueConfigFormData {
  queueName: string;
  prefix: string;
  processFileName: string;
  queueProps: Record<string, string>;
}

import type { RunContainerPayload } from './types/container';

interface NewContainerFormProps {
  onSubmit: (payload: RunContainerPayload) => void;
}

export function NewContainerForm({ onSubmit }: NewContainerFormProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (data: QueueConfigFormData) => {
      console.log('Queue Config Submitted:', data);
      onSubmit(data)
      // Here you can handle the submitted data, e.g., send it to an API
      setIsOpen(false);
    };
  
    const handleClose = () => {
      setIsOpen(false);
    };
  
    return (
      <Dialog className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-fit" >Open Queue Config Form</Button>
        </DialogTrigger>
        {isOpen && <QueueConfigModal onSubmit={handleSubmit} onClose={handleClose} />}
      </Dialog>
    );
}