import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileCog, Info } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { ScrollArea } from '@/components/ui/scroll-area';

const envs = ['stage', 'dev', 'prod'];

const steps = [
  {
    id: 'all_deployments',
    label: 'All Deployments',
    description: 'View all deployments for this config.',
    longDescription: 'TODO: Show all deployments here.'
  },
  {
    id: 'last_deployment',
    label: 'Last Deployment',
    description: 'Most recently completed deployment for each environment.',
    longDescription: 'Shows the most recent deployment details for stage, dev, and prod environments, including tag, PR URL, and Jira.'
  },
  {
    id: 'current_deployment',
    label: 'Current Deployment',
    description: 'Deployment currently running or being processed.',
    longDescription: 'Shows the deployment that is currently running or being processed for each environment, including tag, PR URL, and Jira.'
  }
];

interface ReleaseConfigDetailsProps {
  open: boolean;
  onClose: () => void;
  config: any;
}

export const ReleaseConfigDetails: React.FC<ReleaseConfigDetailsProps> = ({ open, onClose, config }) => {
  const [activeStep, setActiveStep] = useState('all_deployments');
  const currentStepData = steps.find(s => s.id === activeStep) || steps[0];

  if (!config) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-none w-screen h-screen flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="py-4 px-12 border-b flex !flex-row justify-between items-start !w-full">
          <div className="flex flex-col gap-2">
            <DialogTitle
              title={config.repo}
              className="font-medium flex items-center justify-start gap-2"
            >
              <FileCog className="w-4 h-4 " />
              {config.repo}
              <span className="text-xs text-gray-500 ml-2">
                Namespace: {config.namespace}
              </span>
            </DialogTitle>
            <p
              className="text-sm text-gray-500 mb-4"
              title={config.deployment_name}
            >
              Deployment: {config.deployment_name}
            </p>
          </div>
        </DialogHeader>
        <div className="flex-1 h-[calc(100vh-8rem)] px-6 mb-3.5">
          <div className="h-full flex flex-col px-6">
            {/* Top Bar with Tabs and Step Info */}
            <div className="flex flex-row pb-2 items-center justify-between mb-6">
              <div className="flex items-center w-full">
                <Tabs
                  tabs={steps.map(({ id, label }) => ({ id, label }))}
                  activeTab={activeStep}
                  onChange={setActiveStep}
                />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 border border-gray-200 rounded-md ">
              {/* Step Information Card */}
              <div className="col-span-1">
                <Card className="pt-6 shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <CardTitle>{currentStepData.label}</CardTitle>
                    </div>
                    <CardDesc>{currentStepData.description}</CardDesc>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {currentStepData.longDescription}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Main Content Area */}
              {activeStep === "all_deployments" && (
                <ScrollArea className="col-span-2 min-h-0 px-4">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 my-4 space-y-6">
                      <div className="">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>All Deployments</span>
                        </div>
                        <div className="my-1 px-2 text-sm text-gray-500 break-words overflow-x-auto">
                          TODO: Show all deployments here
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
              {(activeStep === "last_deployment" ||
                activeStep === "current_deployment") && (
                <ScrollArea className="col-span-2 min-h-0 px-4">
                  <div className="p-6">
                    <ResourceTable
                      columns={[
                        { header: "Environment", accessor: "env" },
                        { header: "Tag", accessor: "tag" },
                        { header: "PR URL", accessor: "pr_url" },
                        { header: "Jira", accessor: "jira" },
                      ]}
                      data={envs.map((env) => ({
                        env,
                        tag: config[activeStep]?.[env]?.tag || "-",
                        pr_url: config[activeStep]?.[env]?.pr_url ? (
                          <a
                            href={config[activeStep][env].pr_url}
                            className="text-blue-600 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {config[activeStep][env].pr_url}
                          </a>
                        ) : (
                          "-"
                        ),
                        jira: config[activeStep]?.[env]?.jira || "-",
                      }))}
                      className="shadow-none"
                      tableClassName="bg-white"
                    />
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 