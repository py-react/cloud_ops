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
    <div title="Deployment Strategies">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Orbit className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
              Deployment Strategies
              </h2>
              <p className="text-base text-slate-500">
              Browse supported Kubernetes deployment strategies for managing application rollouts.
              </p>
            </div>
          </div>
        }
          shortDescription=""
          description="Kubernetes offers multiple deployment strategies to control how updates are rolled out across pods in a cluster. This page lists the strategies supported by our platform—such as Recreate, RollingUpdate, Blue/Green, and Canary—helping you choose the right approach based on your application's reliability, availability, and rollout preferences. Use this list to understand each strategy's purpose and when to apply it in your deployment workflows."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="">
              <div className="flex items-center space-x-3">
                <ListTree className="h-5 w-5 text-blue-500" />
                <h2 className='text-xl font-semibold text-slate-900'>Available Strategies</h2>
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