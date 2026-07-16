import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Box, HardDrive, FolderOpen, Folder, File, FileImage, FileVideo, FileCode,
    FileArchive, FileText, Download, Upload, Trash2, FolderPlus, RefreshCw,
    ChevronRight, MoreHorizontal, Grid3X3, List, ArrowLeft, AlertTriangle,
    Terminal, Info, Loader2, DollarSign, TrendingUp, Calendar, Maximize2,
    MoveRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DefaultService } from '@/gingerJs_api_client/services/DefaultService';
import { useGCP } from '@/components/gcp/contextProvider/GCPContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import useNavigate from '@/libs/navigate';

type ResourceType = 'OBJECT_STORAGE' | 'BLOCK_STORAGE' | 'FILE_STORAGE';
interface StorageResource { name: string; [key: string]: any; }
interface ExplorerItem { name: string; display_name: string; is_folder: boolean; size?: number; content_type?: string; updated?: string; [key: string]: any; }
interface CostEstimate { baseline_monthly: number; baseline_daily: number; scale_100: number; scale_500: number; scale_1000: number; }

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function formatCurrency(amount: number): string { return `$${amount.toFixed(2)}`; }
function getFileIcon(contentType: string) {
    if (!contentType) return File;
    if (contentType.startsWith('image/')) return FileImage;
    if (contentType.startsWith('video/')) return FileVideo;
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('gzip')) return FileArchive;
    if (contentType.includes('json') || contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('html')) return FileCode;
    if (contentType.startsWith('text/')) return FileText;
    return File;
}
function decodePath(path: string): string { try { return decodeURIComponent(path || ''); } catch { return path || ''; } }
function encodePath(path: string): string { return encodeURIComponent(path); }

function DeleteConfirmModal({ open, onClose, resourceName, resourceType, onConfirm, loading }: { open: boolean; onClose: () => void; resourceName: string; resourceType: string; onConfirm: () => void; loading: boolean }) {
    const [inputValue, setInputValue] = useState('');
    const isValid = inputValue === resourceName;
    useEffect(() => { if (open) setInputValue(''); }, [open]);
    return (
        <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="w-5 h-5" /></div>
                        <AlertDialogTitle className="text-lg">Delete {resourceType}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p>This action is <strong>permanent</strong> and cannot be undone.</p>
                        <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type the name to confirm:</p>
                            <p className="font-mono text-sm font-bold text-foreground">{resourceName}</p>
                        </div>
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={`Type "${resourceName}"`} className="font-mono text-sm" autoFocus />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={!isValid || loading} onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete {resourceType}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function MoveModal({ open, onClose, currentPath, items, onMove, loading }: { open: boolean; onClose: () => void; currentPath: string; items: ExplorerItem[]; onMove: (destPath: string) => void; loading: boolean }) {
    const [selectedPath, setSelectedPath] = useState('/');

    useEffect(() => { if (open) setSelectedPath('/'); }, [open]);

    const folders = items.filter(i => i.is_folder);
    const pathParts = selectedPath === '/' ? [] : selectedPath.split('/').filter(Boolean);

    return (
        <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><MoveRight className="w-5 h-5" /></div>
                        <AlertDialogTitle className="text-lg">Move to Destination</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p className="text-xs text-muted-foreground">Select a destination folder within this bucket.</p>
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            <button onClick={() => setSelectedPath('/')} className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium border-b hover:bg-muted transition-colors ${selectedPath === '/' ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'}`}>
                                <Folder className="w-3.5 h-3.5 text-amber-600" />
                                <span className="truncate">/ (Root)</span>
                            </button>
                            {folders.map((f, i) => {
                                const folderPath = f.name;
                                const isSelected = selectedPath === folderPath;
                                return (
                                    <button key={i} onClick={() => setSelectedPath(folderPath)} className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium border-b hover:bg-muted transition-colors ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'}`}>
                                        <Folder className="w-3.5 h-3.5 text-amber-600" />
                                        <span className="truncate">{f.display_name}</span>
                                    </button>
                                );
                            })}
                            {folders.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground text-center italic">No folders available</p>}
                        </div>
                        <div className="bg-muted/50 rounded-md p-2">
                            <p className="text-[10px] text-muted-foreground">Destination</p>
                            <p className="font-mono text-sm font-bold">{selectedPath === '/' ? '/' : selectedPath + '/'}</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onMove(selectedPath)} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MoveRight className="w-4 h-4 mr-2" />}Confirm Move
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function CostEstimateCard({ estimate, loading }: { estimate: CostEstimate | null; loading: boolean }) {
    if (loading) return <div className="border rounded-lg bg-card p-4 space-y-3 animate-pulse"><div className="h-4 bg-muted rounded w-24" /><div className="h-8 bg-muted rounded w-32" /></div>;
    if (!estimate) return null;
    return (
        <div className="border rounded-lg bg-card p-4 space-y-3">
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /><span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estimated Cost</span></div>
            <div className="space-y-1"><p className="text-2xl font-black">{formatCurrency(estimate.baseline_monthly)}<span className="text-sm font-medium text-muted-foreground">/mo</span></p><p className="text-xs text-muted-foreground">{formatCurrency(estimate.baseline_daily)}/day</p></div>
            <div className="border-t pt-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scale Simulation</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-1.5"><p className="text-[10px] text-muted-foreground">100 GB</p><p className="text-xs font-bold">{formatCurrency(estimate.scale_100)}</p></div>
                    <div className="bg-muted/50 rounded-md p-1.5"><p className="text-[10px] text-muted-foreground">500 GB</p><p className="text-xs font-bold">{formatCurrency(estimate.scale_500)}</p></div>
                    <div className="bg-muted/50 rounded-md p-1.5"><p className="text-[10px] text-muted-foreground">1 TB</p><p className="text-xs font-bold">{formatCurrency(estimate.scale_1000)}</p></div>
                </div>
            </div>
        </div>
    );
}

function AppIntegrationHUD({ resourceType, resourceId, resource, projectId }: { resourceType: ResourceType; resourceId: string; resource: StorageResource | null; projectId: string }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b"><Terminal className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-black uppercase tracking-widest">Application Integration Guidelines</span></div>
            {resourceType === 'OBJECT_STORAGE' && (<>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection Details</p>
                    <div className="space-y-1.5"><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Bucket Name</span><p className="font-mono text-sm font-bold">{resourceId}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Project ID</span><p className="font-mono text-sm font-bold">{projectId}</p></div></div>
                </div>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Python Client</p>
                    <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`from google.cloud import storage\n\nclient = storage.Client(project="${projectId}")\nbucket = client.bucket("${resourceId}")\n\nblobs = bucket.list_blobs(prefix="logs/")\nfor blob in blobs:\n    print(blob.name)`}</pre>
                </div>
            </>)}
            {resourceType === 'BLOCK_STORAGE' && resource && (<>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection Details</p>
                    <div className="grid grid-cols-2 gap-1.5"><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Disk</span><p className="font-mono text-xs font-bold truncate">{resource.name}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Zone</span><p className="font-mono text-xs font-bold">{resource.zone}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Size</span><p className="font-mono text-xs font-bold">{resource.size_gb} GB</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Type</span><p className="font-mono text-xs font-bold">{resource.type}</p></div></div>
                </div>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mount Commands</p>
                    <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-${resource.name}\nsudo mount -o discard,defaults /dev/disk/by-id/google-${resource.name} /var/www/data`}</pre>
                </div>
            </>)}
            {resourceType === 'FILE_STORAGE' && resource && (<>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection Details</p>
                    <div className="grid grid-cols-2 gap-1.5"><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">IP</span><p className="font-mono text-xs font-bold">{resource.networks?.[0]?.ip_addresses?.[0] || '—'}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Share</span><p className="font-mono text-xs font-bold">{resource.file_shares?.[0]?.name || '—'}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Tier</span><p className="font-mono text-xs font-bold">{resource.tier}</p></div><div className="bg-muted/50 rounded-md p-2"><span className="text-[10px] text-muted-foreground">Capacity</span><p className="font-mono text-xs font-bold">{resource.file_shares?.[0]?.capacity_gb || 0} GB</p></div></div>
                </div>
                <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">NFS Mount</p>
                    <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`sudo apt-get install nfs-common -y\nsudo mount ${resource.networks?.[0]?.ip_addresses?.[0] || '[IP]'}:/${resource.file_shares?.[0]?.name || '[SHARE]'} /mnt/app-shared-fs`}</pre>
                </div>
            </>)}
        </div>
    );
}

interface StorageExplorerPageProps { resourceType: ResourceType; backRoute: string; }

export function StorageExplorerPage({ resourceType, backRoute }: StorageExplorerPageProps) {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedGcpCredential } = useGCP();
    const rawPath = searchParams.get('path') || '';
    const currentPath = decodePath(rawPath);

    const [resource, setResource] = useState<StorageResource | null>(null);
    const [items, setItems] = useState<ExplorerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: ExplorerItem | null }>({ open: false, item: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [moveModal, setMoveModal] = useState<{ open: boolean; item: ExplorerItem | null }>({ open: false, item: null });
    const [moveLoading, setMoveLoading] = useState(false);
    const [folderOpen, setFolderOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
    const [costLoading, setCostLoading] = useState(false);
    const [hudCollapsed, setHudCollapsed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

    const fetchResource = useCallback(async () => {
        if (!id || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setLoading(true);
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        try {
            if (resourceType === 'OBJECT_STORAGE') {
                const data: any = await DefaultService.apiV1StorageExplorerGet({ credentialId: credId, projectId, type: 'OBJECT_STORAGE', id, path: currentPath });
                if (data.status === 'error') { toast.error(data.message); setItems([]); return; }
                const NO_EXTRAS = { showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false, showViewDetails: false };
                const folderRows = (data.folders || []).map((f: any) => ({ ...f, ...NO_EXTRAS, is_folder: true, display_name: f.name.replace(currentPath, '').replace(/\/$/, ''), showDelete: true }));
                const objectRows = (data.objects || []).map((o: any) => ({ ...o, ...NO_EXTRAS, is_folder: false, display_name: o.name.replace(currentPath, ''), showDelete: true }));
                setItems([...folderRows, ...objectRows]);
                setResource({ name: id, type: 'bucket' });
            } else if (resourceType === 'BLOCK_STORAGE') {
                const data: any = await DefaultService.apiV1StorageExplorerGet({ credentialId: credId, projectId, type: 'BLOCK_STORAGE', id });
                if (data.status === 'error') { toast.error(data.message); return; }
                setResource(data.selected_disk || null); setItems([]);
            } else if (resourceType === 'FILE_STORAGE') {
                const data: any = await DefaultService.apiV1StorageExplorerGet({ credentialId: credId, projectId, type: 'FILE_STORAGE', id });
                if (data.status === 'error') { toast.error(data.message); return; }
                setResource(data.selected_instance || null); setItems([]);
            }
        } catch { toast.error('Failed to load resource'); }
        finally { setLoading(false); }
    }, [id, resourceType, currentPath, selectedGcpCredential?.project_id, selectedGcpCredential?.id]);

    const fetchCostEstimate = useCallback(async () => {
        if (!id || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id || !resource) return;
        setCostLoading(true);
        const credId = selectedGcpCredential.id;
        const projectId = selectedGcpCredential.project_id;
        try {
            const data: any = await DefaultService.apiV1PricingEstimateGet({
                credentialId: credId,
                resourceType: resourceType === 'OBJECT_STORAGE' ? 'bucket' : resourceType === 'BLOCK_STORAGE' ? 'disk' : 'filestore',
                sizeGb: resourceType === 'OBJECT_STORAGE' ? 10 : resourceType === 'BLOCK_STORAGE' ? resource.size_gb || 100 : resource.file_shares?.[0]?.capacity_gb || 1024,
                diskType: resourceType === 'BLOCK_STORAGE' ? resource.type || 'pd-balanced' : undefined,
                zone: resourceType === 'BLOCK_STORAGE' ? resource.zone || 'us-central1-a' : resourceType === 'FILE_STORAGE' ? resource.location || 'us-central1-a' : undefined,
                tier: resourceType === 'FILE_STORAGE' ? resource.tier || 'STANDARD' : undefined,
                location: resourceType === 'OBJECT_STORAGE' ? 'US' : undefined,
            });
            if (data.estimated_cost_monthly !== undefined) {
                const monthly = data.estimated_cost_monthly;
                const perGb = data.breakdown?.per_gb_price || (monthly / 10);
                setCostEstimate({ baseline_monthly: monthly, baseline_daily: monthly / 30, scale_100: perGb * 100, scale_500: perGb * 500, scale_1000: perGb * 1000 });
            }
        } catch { /* silent */ }
        finally { setCostLoading(false); }
    }, [id, resourceType, resource, selectedGcpCredential?.project_id, selectedGcpCredential?.id]);

    useEffect(() => { fetchResource(); }, [fetchResource]);
    useEffect(() => { fetchCostEstimate(); }, [fetchCostEstimate]);

    const updatePath = (newPath: string) => { const params = new URLSearchParams(searchParams); params.set('path', encodePath(newPath)); setSearchParams(params); };
    const handleNavigateFolder = (item: ExplorerItem) => { if (item.is_folder) updatePath(item.name); };
    const handleBreadcrumbClick = (index: number) => { updatePath(breadcrumbs.slice(0, index + 1).join('/') + '/'); };
    const handleGoToRoot = () => updatePath('');

    const handleDownload = async (item: ExplorerItem) => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            const data: any = await DefaultService.apiV1StorageExplorerObjectsGet({ bucket: id, credentialId: credId, object: item.name, projectId });
            if (data.download_url) window.open(data.download_url, '_blank'); else toast.error(data.message || 'Download failed');
        } catch { toast.error('Failed to generate download link'); }
    };

    const handleDelete = async (item: ExplorerItem | null) => { setDeleteModal({ open: true, item }); };
    const confirmDelete = async () => {
        const { item } = deleteModal;
        if (!id || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setDeleteLoading(true);
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        try {
            if (item && resourceType === 'OBJECT_STORAGE') {
                const data: any = await DefaultService.apiV1StorageExplorerObjectsDelete({ bucket: id, credentialId: credId, object: item.name, isFolder: item.is_folder, projectId });
                if (data.status === 'error') toast.error(data.message); else { toast.success(`"${item.display_name}" deleted`); fetchResource(); }
            } else if (resourceType === 'BLOCK_STORAGE') {
                const data: any = await DefaultService.apiV1GcpComputeDisksDiskNameDelete({ credentialId: credId, diskName: id, projectId, zone: resource?.zone });
                if (data.status === 'error') toast.error(data.message); else { toast.success(`Disk "${id}" deleted`); navigate(backRoute); }
            } else if (resourceType === 'FILE_STORAGE') {
                const data: any = await DefaultService.apiV1GcpFilestoreDelete({ credentialId: credId, instanceId: id, projectId, zone: resource?.location });
                if (data.status === 'error') toast.error(data.message); else { toast.success(`Filestore "${id}" deleted`); navigate(backRoute); }
            }
        } catch { toast.error('Failed to delete'); }
        finally { setDeleteLoading(false); setDeleteModal({ open: false, item: null }); }
    };

    const handleMove = (item: ExplorerItem) => { setMoveModal({ open: true, item }); };
    const confirmMove = async (destPath: string) => {
        const { item } = moveModal;
        if (!item || !id || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        setMoveLoading(true);
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const destPrefix = destPath === '/' ? '' : destPath + '/';
        const destName = destPrefix + item.display_name + (item.is_folder ? '/' : '');
        try {
            const data: any = await DefaultService.apiV1StorageExplorerObjectsPost({ bucket: id, credentialId: credId, projectId, action: 'move', prefix: destName });
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`"${item.display_name}" moved`); fetchResource(); }
        } catch { toast.error('Failed to move item'); }
        finally { setMoveLoading(false); setMoveModal({ open: false, item: null }); }
    };

    const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        let ok = 0;
        for (const file of Array.from(files)) {
            try {
                const d: any = await DefaultService.apiV1StorageExplorerObjectsPost({ bucket: id, credentialId: credId, projectId, prefix: currentPath, action: 'upload' });
                if (d.status !== 'error') ok++;
            } catch { /* continue */ }
        }
        toast.success(`${ok}/${files.length} file(s) uploaded`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchResource();
    };

    const handleCreateFolder = async () => {
        if (!folderName.trim() || !selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const data: any = await DefaultService.apiV1StorageExplorerPost({ credentialId: credId, projectId, type: resourceType, id });
        if (data.status === 'error') toast.error(data.message); else { toast.success(`Folder "${folderName}" created`); setFolderOpen(false); setFolderName(''); fetchResource(); }
    };

    const handleResizeDisk = async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id || !resource) return;
        const newSize = (resource.size_gb || 0) + 10;
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const data: any = await DefaultService.apiV1GcpComputeDisksDiskNameResizePost({ credentialId: credId, diskName: id });
        if (data.status === 'error') toast.error(data.message); else { toast.success(`Disk resized to ${newSize} GB`); fetchResource(); }
    };

    const handleSnapshotDisk = async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id) return;
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const data: any = await DefaultService.apiV1GcpComputeDisksDiskNameSnapshotPost({ credentialId: credId, diskName: id });
        if (data.status === 'error') toast.error(data.message); else toast.success(`Snapshot "${data.snapshot_name}" created`);
    };

    const handleExpandFilestore = async () => {
        if (!selectedGcpCredential?.project_id || !selectedGcpCredential?.id || !resource) return;
        const newCap = (resource.file_shares?.[0]?.capacity_gb || 0) + 1024;
        const shareName = resource.file_shares?.[0]?.name;
        const loc = resource.location || '';
        const credId = selectedGcpCredential.id; const projectId = selectedGcpCredential.project_id;
        const data: any = await DefaultService.apiV1GcpFilestoreInstanceIdExpandPost({ credentialId: credId, instanceId: id });
        if (data.status === 'error') toast.error(data.message); else { toast.success(`Filestore expanded to ${newCap} GB`); fetchResource(); }
    };

    const deleteName = deleteModal.item ? deleteModal.item.display_name : (id || '');
    const deleteType = deleteModal.item ? (deleteModal.item.is_folder ? 'Folder' : 'Object') : (resourceType === 'BLOCK_STORAGE' ? 'Disk' : resourceType === 'FILE_STORAGE' ? 'Filestore Instance' : 'Bucket');
    const resourceIcon = resourceType === 'OBJECT_STORAGE' ? Box : resourceType === 'BLOCK_STORAGE' ? HardDrive : FolderOpen;
    const resourceSubtitle = resourceType === 'OBJECT_STORAGE' ? 'Object Storage Bucket' : resourceType === 'BLOCK_STORAGE' ? 'Persistent Disk' : 'Filestore Instance';

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="border-b bg-card px-6 py-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(backRoute)} className="h-9 w-9 p-0"><ArrowLeft className="w-4 h-4" /></Button>
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${resourceType === 'OBJECT_STORAGE' ? 'bg-blue-50 text-blue-600 border' : resourceType === 'BLOCK_STORAGE' ? 'bg-slate-100 text-slate-700 border' : 'bg-purple-50 text-purple-600 border'}`}>{React.createElement(resourceIcon, { className: 'w-5 h-5' })}</div>
                            <div><h1 className="text-lg font-black font-mono">{id}</h1><p className="text-xs text-muted-foreground">{resourceSubtitle} · {selectedGcpCredential?.project_id}</p></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {resourceType === 'OBJECT_STORAGE' && (<><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => fileInputRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload</Button><input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadFiles} /><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => setFolderOpen(true)}><FolderPlus className="w-3.5 h-3.5 mr-1.5" /> Folder</Button></>)}
                        {resourceType === 'BLOCK_STORAGE' && (<><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={handleResizeDisk}><Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Resize (+10GB)</Button><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={handleSnapshotDisk}><Copy className="w-3.5 h-3.5 mr-1.5" /> Snapshot</Button><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase text-red-600" onClick={() => handleDelete(null)}><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button></>)}
                        {resourceType === 'FILE_STORAGE' && (<><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={handleExpandFilestore}><Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Expand (+1TB)</Button><Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase text-red-600" onClick={() => handleDelete(null)}><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button></>)}
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={fetchResource}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></Button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <CostEstimateCard estimate={costEstimate} loading={costLoading} />
                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /><span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resource Info</span></div>
                        {resourceType === 'OBJECT_STORAGE' && (<div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Type</span><span className="font-bold">Bucket</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Items</span><span className="font-bold">{items.length}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Path</span><span className="font-mono font-bold truncate ml-2 max-w-32">{currentPath || '/'}</span></div></div>)}
                        {resourceType === 'BLOCK_STORAGE' && resource && (<div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><Badge variant={resource.status === 'READY' ? 'success' : 'outline'} className="text-[10px]">{resource.status}</Badge></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Size</span><span className="font-bold">{resource.size_gb} GB</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Type</span><span className="font-mono font-bold">{resource.type}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Zone</span><span className="font-mono font-bold truncate ml-2 max-w-32">{resource.zone}</span></div></div>)}
                        {resourceType === 'FILE_STORAGE' && resource && (<div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted-foreground">State</span><Badge variant={resource.state === 'READY' ? 'success' : 'outline'} className="text-[10px]">{resource.state}</Badge></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Capacity</span><span className="font-bold">{resource.file_shares?.[0]?.capacity_gb || 0} GB</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Tier</span><span className="font-mono font-bold">{resource.tier}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Location</span><span className="font-mono font-bold truncate ml-2 max-w-32">{resource.location}</span></div></div>)}
                    </div>
                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" /><span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</span></div>
                        <div className="space-y-1.5"><Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => navigate(backRoute)}><ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Storage Hub</Button>{resourceType === 'OBJECT_STORAGE' && <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>{viewMode === 'list' ? <Grid3X3 className="w-3.5 h-3.5 mr-2" /> : <List className="w-3.5 h-3.5 mr-2" />}Switch to {viewMode === 'list' ? 'Grid' : 'List'} View</Button>}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                    {resourceType === 'OBJECT_STORAGE' && (<>
                        <div className="border-b bg-muted/20 px-4 py-2 flex items-center gap-1 text-xs font-bold shrink-0">
                            <button onClick={handleGoToRoot} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors text-primary"><Box className="w-3 h-3" />{id}</button>
                            {breadcrumbs.map((crumb, i) => (<React.Fragment key={i}><ChevronRight className="w-3 h-3 text-muted-foreground" /><button onClick={() => handleBreadcrumbClick(i)} className="px-2 py-1 rounded hover:bg-muted transition-colors text-foreground">{crumb}</button></React.Fragment>))}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {viewMode === 'list' ? (<div className="divide-y">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b bg-muted/30"><div className="col-span-6">Name</div><div className="col-span-2">Type</div><div className="col-span-2">Size</div><div className="col-span-2">Modified</div></div>
                                {loading ? <div className="p-8 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
                                    : items.length === 0 ? <div className="p-12 text-center"><Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm font-bold text-muted-foreground">This folder is empty</p></div>
                                    : items.map((item, i) => {
                                        const Icon = item.is_folder ? Folder : getFileIcon(item.content_type || '');
                                        return (<div key={i} className="grid grid-cols-12 gap-4 px-4 py-2.5 hover:bg-muted/30 cursor-pointer group transition-colors" onClick={() => handleNavigateFolder(item)}>
                                            <div className="col-span-6 flex items-center gap-3 min-w-0"><div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${item.is_folder ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}><Icon className="w-3.5 h-3.5" /></div><span className="text-sm font-medium truncate">{item.display_name}</span></div>
                                            <div className="col-span-2 flex items-center"><Badge variant="outline" className="text-[10px] font-bold uppercase">{item.is_folder ? 'folder' : (item.content_type?.split('/')[1] || 'file')}</Badge></div>
                                            <div className="col-span-2 flex items-center"><span className="font-mono text-xs text-muted-foreground">{item.is_folder ? '—' : formatBytes(item.size || 0)}</span></div>
                                            <div className="col-span-2 flex items-center justify-end"><span className="font-mono text-xs text-muted-foreground">{item.updated ? new Date(item.updated).toLocaleDateString() : '—'}</span>
                                                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!item.is_folder && <DropdownMenuItem onClick={() => handleDownload(item)}><Download className="w-3.5 h-3.5 mr-2" /> Download</DropdownMenuItem>}
                                                        <DropdownMenuItem onClick={() => handleMove(item)}><MoveRight className="w-3.5 h-3.5 mr-2" /> Move</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>);
                                    })}
                            </div>) : (<div className="p-4 grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {loading ? Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)
                                    : items.length === 0 ? <div className="col-span-full p-12 text-center"><Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm font-bold text-muted-foreground">This folder is empty</p></div>
                                    : items.map((item, i) => { const Icon = item.is_folder ? Folder : getFileIcon(item.content_type || ''); return (<div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/30 cursor-pointer group transition-colors border" onClick={() => handleNavigateFolder(item)}><div className={`h-12 w-12 rounded-lg flex items-center justify-center ${item.is_folder ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}><Icon className="w-6 h-6" /></div><span className="text-xs font-medium text-center truncate w-full">{item.display_name}</span>{!item.is_folder && <span className="text-[10px] text-muted-foreground">{formatBytes(item.size || 0)}</span>}</div>); })}
                            </div>)}
                        </div>
                    </>)}

                    {resourceType === 'BLOCK_STORAGE' && (<div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p><Badge variant={resource?.status === 'READY' ? 'success' : 'outline'} className="text-xs font-bold uppercase">{resource?.status || 'UNKNOWN'}</Badge></div>
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Block Device Storage Volume</p><p className="text-2xl font-black">{resource?.size_gb || 0} GB</p></div>
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</p><p className="font-mono font-bold">{resource?.type || '—'}</p></div>
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Zone</p><p className="font-mono font-bold">{resource?.zone || '—'}</p></div>
                        </div>
                        <div className="border rounded-lg p-4 space-y-3"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Allowed Operations</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleResizeDisk}><Maximize2 className="w-3.5 h-3.5 mr-2" /> Resize Volume</Button><Button variant="outline" size="sm" onClick={handleSnapshotDisk}><Copy className="w-3.5 h-3.5 mr-2" /> Point-in-time Snapshot</Button><Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(null)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Disk</Button></div></div>
                    </div>)}

                    {resourceType === 'FILE_STORAGE' && (<div className="flex-1 p-6 space-y-6 overflow-y-auto">{resource && (<>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</p><Badge variant={resource.state === 'READY' ? 'success' : 'outline'} className="text-xs font-bold uppercase">{resource.state}</Badge></div>
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tier</p><p className="font-mono font-bold">{resource.tier}</p></div>
                            <div className="border rounded-lg p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capacity</p><p className="text-2xl font-black">{resource.file_shares?.[0]?.capacity_gb || 0} GB</p></div>
                        </div>
                        <div className="border rounded-lg p-4"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Storage Utilization</p><div className="space-y-3">{resource.file_shares?.map((share: any) => (<div key={share.name} className="space-y-1.5"><div className="flex items-center justify-between text-xs"><span className="font-mono font-bold">{share.name}</span><span className="text-muted-foreground">{share.capacity_gb} GB</span></div><div className="h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${Math.min((share.capacity_gb / 10240) * 100, 100)}%` }} /></div></div>))}</div></div>
                        <div className="border rounded-lg p-4 space-y-3"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Allowed Operations</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleExpandFilestore}><Maximize2 className="w-3.5 h-3.5 mr-2" /> Expand Share</Button><Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(null)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Deprovision Instance</Button></div></div>
                    </>)}</div>)}
                </div>

                <div className={`border-l bg-card overflow-y-auto shrink-0 transition-all ${hudCollapsed ? 'w-10' : 'w-80'}`}>
                    {hudCollapsed ? <Button variant="ghost" size="sm" className="h-full w-full rounded-none" onClick={() => setHudCollapsed(false)}><Terminal className="w-4 h-4" /></Button> : (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b"><div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-black uppercase tracking-widest">Integration</span></div><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHudCollapsed(true)}><Info className="w-3.5 h-3.5" /></Button></div>
                            <div className="flex-1 overflow-y-auto"><AppIntegrationHUD resourceType={resourceType} resourceId={id || ''} resource={resource} projectId={selectedGcpCredential?.project_id || ''} /></div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} resourceName={deleteName} resourceType={deleteType} onConfirm={confirmDelete} loading={deleteLoading} />
            <MoveModal open={moveModal.open} onClose={() => setMoveModal({ open: false, item: null })} currentPath={currentPath} items={items} onMove={confirmMove} loading={moveLoading} />
            {folderOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFolderOpen(false)}><div className="bg-card border rounded-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}><h3 className="text-lg font-bold flex items-center gap-2"><FolderPlus className="w-5 h-5" /> New Folder</h3><div className="space-y-1.5"><label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Folder Name</label><Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. logs" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setFolderOpen(false); setFolderName(''); }}>Cancel</Button><Button onClick={handleCreateFolder} disabled={!folderName.trim()}>Create Folder</Button></div></div></div>)}
        </div>
    );
}
