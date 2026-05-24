import React from "react";
import { S3ExplorerPage } from '@/components/aws/storage/S3ExplorerPage';

export default function BucketDetail() {
    return <S3ExplorerPage backRoute="/settings/aws/storage/buckets" />;
}
