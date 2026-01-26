import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileCog, ListTree, Orbit } from 'lucide-react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import RouteDescription from '@/components/route-description';
import { TooltipWrapper } from '@/components/ui/tooltip';

interface DeploymentStrategy {
  id: number;
  type: string;
  description: string;
}

interface TransformedDeploymentStrategy {
  id: number;
  type: string;
  description: JSX.Element;
}

const getStrategyDetails = (type: string) => {
  switch (type) {
    case 'rolling':
      return [
        'Minimal downtime during updates',
        'Gradual rollout of changes',
        'Automatic rollback on failure'
      ];
    case 'blue-green':
      return [
        'Zero downtime deployments',
        'Instant rollback capability',
        'Testing in production-like environment'
      ];
    case 'canary':
      return [
        'Reduced risk with partial rollout',
        'Early feedback from real users',
        'Fine-grained traffic control'
      ];
    case 'recreate':
      return [
        'Complete environment refresh',
        'Suitable for major version changes',
        'Simplest deployment strategy'
      ];
    default:
      return [];
  }
};

const columns = [
  { header: 'Strategy Type', accessor: 'type' },
  { header: 'ID', accessor: 'id' },
  { header: 'Description', accessor: 'description' }
];

interface DeploymentStrategyPageProps {
  strategies: string[];
}

const DeploymentStrategyPage = ({ strategies }: DeploymentStrategyPageProps) => {
  const [deploymentStrategies] = useState<TransformedDeploymentStrategy[]>(() => {
    return (strategies || []).map((item: string) => {
      const strategy: DeploymentStrategy = JSON.parse(item);
      return {
        id: strategy.id,
        type: strategy.type,
        description: (
          <TooltipWrapper
            content={
              <div className="space-y-2">
                <ul className="list-disc list-inside text-xs">
                  {getStrategyDetails(strategy.type).map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            }
          >
            <span className="cursor-help">{strategy.description}</span>
          </TooltipWrapper>
        )
      };
    });
  });

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
      {/* Page Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-1 p-1">
            <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <Orbit className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Release Strategies</h1>
              <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                Kubernetes offers multiple deployment strategies to control how updates are rolled out.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 mt-10">
        <ResourceTable
          title="Available Strategies"
          description="Reference these strategy IDs when configuring your deployments. Hover over strategy description to see more details."
          icon={<ListTree className="h-4 w-4" />}
          columns={columns}
          data={deploymentStrategies}
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default DeploymentStrategyPage; 