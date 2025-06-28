import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileCog, Orbit } from 'lucide-react';
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

const DeploymentStrategyPage = ({strategies}: DeploymentStrategyPageProps) => {
  const [deploymentStrategies] = useState<TransformedDeploymentStrategy[]>(() => {
    return (strategies||[]).map((item: string) => {
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
    <div title="Deployment Strategies" className="p-4 w-full">
      <div className="space-y-6">
        <RouteDescription
          title={<span className="flex items-center gap-2"><Orbit className="h-4 w-4" /> Deployment Strategies</span>}
          shortDescription="Browse supported Kubernetes deployment strategies for managing application rollouts."
          description="Kubernetes offers multiple deployment strategies to control how updates are rolled out across pods in a cluster. This page lists the strategies supported by our platform—such as Recreate, RollingUpdate, Blue/Green, and Canary—helping you choose the right approach based on your application's reliability, availability, and rollout preferences. Use this list to understand each strategy's purpose and when to apply it in your deployment workflows."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center justify-between">
                <h2>Available Strategies</h2>
              </div>
            </CardTitle>
            <CardDescription>
              Reference these strategy IDs when configuring your deployments. Hover over strategy description to see more details.
            </CardDescription>
          </CardHeader>
          <CardContent className="shadow-none p-0">
            <ResourceTable
              columns={columns}
              data={deploymentStrategies}
              onEdit={undefined}
              onDelete={undefined}
              onViewDetails={undefined}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeploymentStrategyPage; 