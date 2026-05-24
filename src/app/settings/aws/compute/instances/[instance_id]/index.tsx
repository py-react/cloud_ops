import React from "react";
import { EC2ExplorerPage } from '@/components/aws/compute/EC2ExplorerPage';

export default function EC2InstanceDetail() {
    return <EC2ExplorerPage backRoute="/settings/aws/compute" />;
}
