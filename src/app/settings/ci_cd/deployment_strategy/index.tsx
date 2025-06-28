import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileCog } from 'lucide-react';
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
  type: JSX.Element;
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
  const [deploymentStrategies, setDeploymentStrategies] = useState<TransformedDeploymentStrategy[]>(() => {
    return strategies.map((item: string) => {
      const strategy: DeploymentStrategy = JSON.parse(item);
      return {
        id: strategy.id,
        type: (
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
            <span className="cursor-help">{strategy.type}</span>
          </TooltipWrapper>
        ),
        description: <div className="max-w-md">{strategy.description}</div>
      };
    });
  });

  useEffect(() => {
    setDeploymentStrategies(strategies.map((item: string) => {
      const strategy: DeploymentStrategy = JSON.parse(item);
      return {
        id: strategy.id,
        type: (
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
            <span className="cursor-help">{strategy.type}</span>
          </TooltipWrapper>
        ),
        description: <div className="max-w-md">{strategy.description}</div>
      };
    }));
  }, [strategies]);

  return (
    <div title="Deployment Strategies" className="p-4 w-full">
      <div className="space-y-6">
        <RouteDescription
          title={<span className="flex items-center gap-2"><FileCog className="h-4 w-4" /> Deployment Strategies</span>}
          shortDescription="Available deployment strategies for your services."
          description="View the different deployment strategies that can be used when deploying your services. Each strategy has its own characteristics and is suited for different scenarios."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center justify-between">
                <h2>Available Strategies</h2>
              </div>
            </CardTitle>
            <CardDescription>
              Reference these strategy IDs when configuring your deployments. Hover over strategy types to see more details.
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