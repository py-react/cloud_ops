import { StorageExplorerPage } from '../../../../../../components/gcp/ExplorerPage';

export default function DiskExplorer() {
    return <StorageExplorerPage resourceType="BLOCK_STORAGE" backRoute="/settings/gcp/storage/disks" />;
}
