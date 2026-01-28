import React, { useState, useEffect } from 'react';
import { FileCog } from 'lucide-react';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { TooltipWrapper } from '@/components/ui/tooltip';
import PageLayout from '@/components/PageLayout';

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

const DeploymentStrategyPage = ({ strategies }: DeploymentStrategyPageProps) => {
  const transformStrategies = (items: string[]) => {
    return items.map((item: string) => {
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
  };

  const [deploymentStrategies, setDeploymentStrategies] = useState<TransformedDeploymentStrategy[]>(() => transformStrategies(strategies));

  useEffect(() => {
    setDeploymentStrategies(transformStrategies(strategies));
  }, [strategies]);

  return (
    <PageLayout
      title="Deployment Strategies"
      subtitle="Available deployment strategies for your services. Reference these ID's when configuring your deployments."
      icon={FileCog}
    >
      <div className="flex-1 min-h-0 mt-10">
        <ResourceTable
          title="Available Strategies"
          description="Reference these strategy IDs when configuring your deployments. Hover over strategy types to see more details."
          icon={<FileCog className="h-4 w-4" />}
          columns={columns}
          data={deploymentStrategies}
          className="mt-4"
        />
      </div>
    </PageLayout>
  );
};

export default DeploymentStrategyPage;