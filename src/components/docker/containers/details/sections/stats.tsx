import React from 'react'
import { ContainerStats } from '../../common/ContainerStats';

const Stats = ({ container }: { container: any }) => {
  return (
    <div className="col-span-2">
      <ContainerStats containerId={container.id} />
    </div>
  );
};

export default Stats