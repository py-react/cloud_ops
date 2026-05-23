import { StorageExplorerPage } from '../../../../../../components/gcp/ExplorerPage';

export default function FilestoreExplorer() {
    return <StorageExplorerPage resourceType="FILE_STORAGE" backRoute="/settings/gcp/storage/filestores" />;
}
