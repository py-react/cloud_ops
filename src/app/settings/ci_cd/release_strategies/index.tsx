import React, { useState } from 'react';
import { ListTree, Orbit } from 'lucide-react';
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
    <PageLayout
      title="Release Strategies"
      subtitle="Kubernetes offers multiple deployment strategies to control how updates are rolled out."
      icon={Orbit}
    >
      <div className="flex-1 min-h-0 mt-2">
        <ResourceTable
          title="Available Strategies"
          description="Reference these strategy IDs when configuring your deployments. Hover over strategy description to see more details."
          icon={<ListTree className="h-4 w-4" />}
          columns={columns}
          data={deploymentStrategies}
          className="mt-4"
        />
      </div>
    </PageLayout>
  );
};

export default DeploymentStrategyPage;