import React from "react";
import { StorageExplorerPage } from '../../../../../../components/gcp/ExplorerPage';

export default function BucketExplorer() {
    return <StorageExplorerPage resourceType="OBJECT_STORAGE" backRoute="/settings/gcp/storage/buckets" />;
}
