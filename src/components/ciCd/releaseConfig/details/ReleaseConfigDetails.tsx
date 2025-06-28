import React, { useState } from 'react';
import { FileCog } from 'lucide-react';
import { OverviewStep } from './sections/OverviewStep';
import { ContainersStep } from './sections/ContainersStep';
import { ServicePortsStep } from './sections/ServicePortsStep';
import { RunsStep } from './sections/RunsStep';
import Wizard from '@/components/wizard/wizard';

interface ReleaseConfigDetailsProps {
  open: boolean;
  onClose: () => void;
  config: any;
}

export const ReleaseConfigDetails = ({open, onClose, config}:ReleaseConfigDetailsProps)=>{
  const [currentStep, setCurrentStep] = useState("overview");


  const steps = [
    {
      id: "overview",
      label: "Overview",
      description: "Basic deployment configuration info.",
      longDescription:
        "Shows the basic information for this deployment config, including type, namespace, deployment name, tag, strategy, and replicas.",
      props: { config },
      component: OverviewStep,
    },
    {
      id: "containers",
      label: "Containers",
      description: "Configured containers for this deployment.",
      longDescription:
        "Shows all containers and their configuration for this deployment.",
      component: ContainersStep,
      props: { containers: config?.containers || [] },
    },
    {
      id: "service_ports",
      label: "Service Ports",
      description: "Configured service ports.",
      longDescription: "Shows all service ports for this deployment.",
      component: ServicePortsStep,
      props: { service_ports: config?.service_ports || [] },
    },
    {
      id: "runs",
      label: "Run",
      description: "Deployment runs for this config.",
      longDescription: "Shows all deployment runs for this deployment config.",
      component: RunsStep,
      props: { config },
    },
  ];


  if (!config) return null;

  return (
    <Wizard
      heading={{
        primary: config.deployment_name,
        icon: FileCog,
      }}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      isWizardOpen={open}
      setIsWizardOpen={(isOpen) => {
        if (!isOpen) onClose();
      }}
      // @ts-ignore
      steps={steps}
    />
  );
}
