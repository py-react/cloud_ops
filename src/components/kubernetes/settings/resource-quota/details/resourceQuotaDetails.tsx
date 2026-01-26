import React, { useState } from "react";
import { DatabaseIcon, Info, Activity, Layers, Trash2 } from "lucide-react";
import Wizard from "@/components/wizard/wizard";
import ResourceQuotaOverview from "./sections/overview";
import ResourceQuotaStats from "./sections/stats";
import QuotaScopes from "./sections/scopes";
import AdvancedTab from "./sections/advance";

export const ResourceQuotaDetailsModel = ({
  open,
  onClose,
  quota,
  onDelete
}: {
  open: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>
  quota: Record<string, any>;
  onDelete: (data: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  const steps = [
    {
      id: "overview",
      label: "Overview",
      icon: Info,
      description: "General information about the resource quota.",
      longDescription: "View essential details such as namespace, creation time, and quota name.",
      props: { quota },
      component: ResourceQuotaOverview,
    },
    {
      id: "stats",
      label: "Stats",
      icon: Activity,
      description: (
        <>
          Resource quotas can track usage for CPU, memory, pods, object counts, and more.{' '}
          <a
            href="https://kubernetes.io/docs/concepts/policy/resource-quotas/#resource-quota-per-priorityclass"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Docs
          </a>
        </>
      ),
      longDescription: "See CPU, memory, and other resource quota usage and limits. Object count quotas are also supported.",
      props: { quota },
      component: ResourceQuotaStats,
    },
    {
      id: "scopes",
      label: "Scopes",
      icon: Layers,
      description: (
        <>
          Resource Quotas can be limited by scopes and scope selectors.{' '}
          <a
            href="https://kubernetes.io/docs/concepts/policy/resource-quotas/#quota-scopes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Learn more
          </a>
        </>
      ),
      longDescription: "See which resources and pods this quota applies to, and how scope selectors are configured. Mutually exclusive scopes (e.g., Terminating & NotTerminating, BestEffort & NotBestEffort) are not allowed.",
      props: { quota },
      component: QuotaScopes,
    },
    {
      id: "advance",
      label: "Advance",
      icon: Trash2,
      description: "Delete Quota from cluster",
      longDescription: "Perform advanced operations like deleting this resource quota from the cluster. Use with caution as this action is irreversible.",
      props: { quotaName: quota.name, handleDelete: () => onDelete(quota) },
      component: AdvancedTab,
    },
  ];

  return (
    <Wizard
      currentStep={activeTab}
      setCurrentStep={setActiveTab}
      isWizardOpen={open}
      setIsWizardOpen={onClose}
      steps={steps}
      heading={{
        primary: quota.name,
        secondary: `Namespace: ${quota.namespace}`,
        icon: DatabaseIcon,
        actions: (
          <a
            href="https://kubernetes.io/docs/concepts/policy/resource-quotas/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
            title="Kubernetes Resource Quotas Documentation"
          >
            <Info className="w-4 h-4" />
            Docs
          </a>
        ),
      }}
    />
  );
};

export default ResourceQuotaDetailsModel;
