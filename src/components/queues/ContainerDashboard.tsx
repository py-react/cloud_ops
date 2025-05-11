import React from 'react';
import { useContainers } from './hooks/useContainer';
import { ContainerList } from './ContainerList';
import { NewContainerForm } from './NewContainerForm';
import { DashboardHeader } from './DashboardHeader';

export function ContainerDashboard() {
  const { containers, loading, error, startContainer, removeContainer } = useContainers();

  return (
    <div className="container py-8">
      <DashboardHeader />
      
      <div className="grid gap-6">
        <NewContainerForm onSubmit={startContainer} />
        <ContainerList 
        containers={containers} 
        onRemove={removeContainer}
        />
      </div>
    </div>
  );
}