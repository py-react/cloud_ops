import React from 'react';
import { Container } from './types/container';
import { ContainerCard } from './ContainerCard';

interface ContainerListProps {
  containers: Container[];
  onRemove: (containerId: string) => void;
}

export function ContainerList({ containers, onRemove }: ContainerListProps) {
  if (containers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No containers running
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {containers.map((container) => (
        <ContainerCard
          key={container.id}
          container={container}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}