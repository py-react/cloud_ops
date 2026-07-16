import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Box, Folder, File, FileImage, FileVideo, FileCode,
    FileArchive, FileText, Download, Upload, Trash2, FolderPlus, RefreshCw,
    ChevronRight, MoreHorizontal, ArrowLeft, AlertTriangle,
    Terminal, Info, Loader2, DollarSign, TrendingUp, Calendar,
    Grid3X3, List, MoveRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import { DefaultService } from '@/gingerJs_api_client';
import { useAWS } from '@/components/aws/contextProvider/AWSContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import useNavigate from '@/libs/navigate';

interface ExplorerItem {
    name: string;
    display_name: string;
    is_folder: boolean;
    size?: number;
    content_type?: string;
    updated?: string;
}

interface BucketConfig {
    name?: string;
    region?: string;
    storage_class?: string;
    versioning_enabled?: boolean;
    versioning_expire_days?: number;
    object_lock_enabled?: boolean;
    object_lock_mode?: string;
    object_lock_days?: number;
    encryption?: string;
    kms_key_id?: string;
    bucket_policy?: string;
    tags?: Record<string, string>;
    [key: string]: any;
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

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

interface CostEstimate {
    estimated_cost_monthly: number;
    estimated_cost_daily: number;
    breakdown: {
        per_gb_price: number;
        base_storage: number;
        surcharges: Record<string, number>;
        total_surcharges: number;
    };
    sku_description?: string;
    [key: string]: any;
}

function CostEstimateCard({ estimate, loading }: { estimate: CostEstimate | null; loading: boolean }) {
    if (loading) {
        return (
            <div className="border rounded-lg bg-card p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-32" />
            </div>
        );
    }
    if (!estimate) return null;
    const scale100 = estimate.breakdown.per_gb_price * 100;
    const scale500 = estimate.breakdown.per_gb_price * 500;
    const scale1000 = estimate.breakdown.per_gb_price * 1000;
    return (
        <div className="border rounded-lg bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estimated Cost</span>

            </div>
            <div className="space-y-1">
                <p className="text-2xl font-black">
                    {formatCurrency(estimate.estimated_cost_monthly)}<span className="text-sm font-medium text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(estimate.estimated_cost_daily)}/day</p>
            </div>
            <div className="border-t pt-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scale Simulation</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-1.5">
                        <p className="text-[10px] text-muted-foreground">100 GB</p>
                        <p className="text-xs font-bold">{formatCurrency(scale100)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                        <p className="text-[10px] text-muted-foreground">500 GB</p>
                        <p className="text-xs font-bold">{formatCurrency(scale500)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                        <p className="text-[10px] text-muted-foreground">1 TB</p>
                        <p className="text-xs font-bold">{formatCurrency(scale1000)}</p>
                    </div>
                </div>
            </div>
            {estimate.sku_description && (
                <div className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span className="font-semibold">SKU:</span> {estimate.sku_description}
                </div>
            )}
        </div>
    );
}

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

function AppIntegrationHUD({ bucketName, region }: { bucketName: string; region: string }) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-widest">Application Integration Guidelines</span>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connection Details</p>
                <div className="space-y-1.5">
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">Bucket Name</span>
                        <p className="font-mono text-sm font-bold">{bucketName}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-[10px] text-muted-foreground">Region</span>
                        <p className="font-mono text-sm font-bold">{region}</p>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Python Client (boto3)</p>
                <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`import boto3\n\ns3 = boto3.client("s3", region_name="${region}")\nbucket = "${bucketName}"\n\nresponse = s3.list_objects_v2(\n    Bucket=bucket,\n    Prefix="logs/"\n)\nfor obj in response.get("Contents", []):\n    print(obj["Key"])`}</pre>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AWS CLI</p>
                <pre className="bg-slate-950 text-slate-200 rounded-md p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`aws s3 ls s3://${bucketName}/logs/ \\\n    --region ${region}`}</pre>
            </div>
        </div>
    );
}

interface S3ExplorerPageProps {
    backRoute: string;
}

export function S3ExplorerPage({ backRoute }: S3ExplorerPageProps) {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedAwsCredential } = useAWS();
    const rawPath = searchParams.get('path') || '';
    const currentPath = decodePath(rawPath);

    const [items, setItems] = useState<ExplorerItem[]>([]);
    const [config, setConfig] = useState<BucketConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(false);
    const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
    const [costLoading, setCostLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [folderName, setFolderName] = useState('');
    const [folderOpen, setFolderOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: ExplorerItem | null }>({ open: false, item: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [moveModal, setMoveModal] = useState<{ open: boolean; item: ExplorerItem | null }>({ open: false, item: null });
    const [moveLoading, setMoveLoading] = useState(false);
    const [hudCollapsed, setHudCollapsed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];
    const region = config?.region || 'us-east-1';

    const fetchObjects = useCallback(async () => {
        if (!id || !selectedAwsCredential?.id) return;
        setLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsBucketNameGet({ bucketName: id, credentialId: String(credId), region, prefix: currentPath });
            if (data.status === 'error') { toast.error(data.message); setItems([]); return; }
            const NO_EXTRAS = { showPlay: false, showStop: false, showPause: false, showClone: false, showUndo: false, showViewLogs: false, showViewConfig: false, showEdit: false, showPush: false, showViewDetails: false };
            const folderRows = (data.folders || []).map((f: any) => ({
                ...f, ...NO_EXTRAS,
                is_folder: true,
                display_name: f.name.replace(currentPath, '').replace(/\/$/, ''),
                showDelete: true,
            }));
            const objectRows = (data.objects || []).map((o: any) => ({
                ...o, ...NO_EXTRAS,
                is_folder: false,
                display_name: o.name.replace(currentPath, ''),
                showDelete: true,
            }));
            setItems([...folderRows, ...objectRows]);
        } catch { toast.error('Failed to load objects'); }
        finally { setLoading(false); }
    }, [id, currentPath, region, selectedAwsCredential?.id]);

    const fetchConfig = useCallback(async () => {
        if (!id || !selectedAwsCredential?.id) return;
        setConfigLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsBucketNameConfigGet({ bucketName: id, credentialId: String(credId) });
            if (data.status !== 'error') setConfig(data);
        } catch { /* silent */ }
        finally { setConfigLoading(false); }
    }, [id, selectedAwsCredential?.id]);

    const fetchCostEstimate = useCallback(async () => {
        if (!id || !selectedAwsCredential?.id) return;
        setCostLoading(true);
        const credId = selectedAwsCredential.id;
        try {
            const storageClass = config?.storage_class || 'STANDARD';
            const localRegion = config?.region || 'us-east-1';
            const data: any = await DefaultService.apiV1PricingEstimateGet({
                credentialId: String(credId),
                resourceType: 's3_bucket',
                location: localRegion,
                storageClass,
                sizeGb: 10,
            });
            if (data.estimated_cost_monthly !== undefined) setCostEstimate(data);
        } catch { /* silent */ }
        finally { setCostLoading(false); }
    }, [id, config?.storage_class, config?.region, selectedAwsCredential?.id]);

    useEffect(() => { fetchObjects(); }, [fetchObjects, region]);
    useEffect(() => { fetchConfig(); }, [fetchConfig]);
    useEffect(() => { fetchCostEstimate(); }, [fetchCostEstimate]);

    const updatePath = (newPath: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('path', encodePath(newPath));
        setSearchParams(params);
    };

    const handleNavigateFolder = (item: ExplorerItem) => {
        if (item.is_folder) updatePath(item.name);
    };

    const handleBreadcrumbClick = (index: number) => {
        updatePath(breadcrumbs.slice(0, index + 1).join('/') + '/');
    };

    const handleGoToRoot = () => updatePath('');

    const handleCreateFolder = async () => {
        if (!folderName.trim() || !id || !selectedAwsCredential?.id) return;
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        try {
            const res = await fetch(`/api/v1/aws/storage/buckets/${encodeURIComponent(id)}?region=${encodeURIComponent(region)}&credential_id=${credId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_folder', folder_name: folderName.trim(), prefix: currentPath })
            });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`Folder "${folderName}" created`); setFolderOpen(false); setFolderName(''); fetchObjects(); }
        } catch { toast.error('Failed to create folder'); }
    };

    const handleDownload = async (item: ExplorerItem) => {
        if (!selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        try {
            const data: any = await DefaultService.apiV1AwsStorageBucketsBucketNameUploadGet({ bucketName: id || '', credentialId: String(credId), region, prefix: item.name });
            if (data.download_url) window.open(data.download_url, '_blank');
            else if (data.url) window.open(data.url, '_blank');
            else toast.error(data.message || 'Download failed');
        } catch { toast.error('Failed to generate download link'); }
    };

    const handleDeleteClick = (item: ExplorerItem) => { setDeleteModal({ open: true, item }); };

    const confirmDelete = async () => {
        const { item } = deleteModal;
        if (!id || !selectedAwsCredential?.id || !item) return;
        setDeleteLoading(true);
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        try {
            const res = await fetch(`/api/v1/aws/storage/buckets/${encodeURIComponent(id)}?object=${encodeURIComponent(item.name)}&is_folder=${item.is_folder}&region=${encodeURIComponent(region)}&credential_id=${credId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`"${item.display_name}" deleted`); fetchObjects(); }
        } catch { toast.error('Failed to delete'); }
        finally { setDeleteLoading(false); setDeleteModal({ open: false, item: null }); }
    };

    const handleMoveClick = (item: ExplorerItem) => { setMoveModal({ open: true, item }); };

    const confirmMove = async (destPath: string) => {
        const { item } = moveModal;
        if (!item || !id || !selectedAwsCredential?.id) return;
        setMoveLoading(true);
        const token = getAuthToken();
        const credId = selectedAwsCredential.id;
        const destPrefix = destPath === '/' ? '' : destPath + '/';
        const destName = destPrefix + item.display_name + (item.is_folder ? '/' : '');
        try {
            const res = await fetch(`/api/v1/aws/storage/buckets/${encodeURIComponent(id)}?action=move&region=${encodeURIComponent(region)}&credential_id=${credId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'move', source_object: item.name, destination_object: destName, is_folder: item.is_folder })
            });
            const data = await res.json();
            if (data.status === 'error') toast.error(data.message);
            else { toast.success(`"${item.display_name}" moved`); fetchObjects(); }
        } catch { toast.error('Failed to move item'); }
        finally { setMoveLoading(false); setMoveModal({ open: false, item: null }); }
    };

    const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !selectedAwsCredential?.id) return;
        const credId = selectedAwsCredential.id;
        const token = getAuthToken();
        let ok = 0;
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('file', file);
            try {
                const res = await fetch(`/api/v1/aws/storage/buckets/${encodeURIComponent(id || '')}/upload/?region=${encodeURIComponent(region)}&credential_id=${credId}&prefix=${encodeURIComponent(currentPath)}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
                const d = await res.json();
                if (d.status !== 'error') ok++;
            } catch { }
        }
        toast.success(`${ok}/${files.length} file(s) uploaded`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchObjects();
    };

    const deleteName = deleteModal.item ? deleteModal.item.display_name : (id || '');
    const deleteType = deleteModal.item ? (deleteModal.item.is_folder ? 'Folder' : 'Object') : 'Bucket';
    const objectCount = items.filter(i => !i.is_folder).length;
    const folderCount = items.filter(i => i.is_folder).length;

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="border-b bg-card px-6 py-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(backRoute)} className="h-9 w-9 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border">
                                <Box className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black font-mono">{id}</h1>
                                <p className="text-xs text-muted-foreground">S3 Bucket · {selectedAwsCredential?.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                        </Button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadFiles} />
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase"
                            onClick={() => setFolderOpen(true)}>
                            <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> Folder
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { fetchObjects(); fetchConfig(); }}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <CostEstimateCard estimate={costEstimate} loading={costLoading} />

                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resource Info</span>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Type</span>
                                <span className="font-bold">Bucket</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Region</span>
                                <span className="font-mono font-bold">{config?.region || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Storage Class</span>
                                <span className="font-mono font-bold">{config?.storage_class || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Encryption</span>
                                <span className="font-mono font-bold">{config?.encryption || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Versioning</span>
                                <Badge variant={config?.versioning_enabled ? 'success' : 'outline'} className="text-[10px]">
                                    {config?.versioning_enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</span>
                        </div>
                        <div className="space-y-1.5">
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => navigate(backRoute)}>
                                <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Buckets
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                                {viewMode === 'list' ? <Grid3X3 className="w-3.5 h-3.5 mr-2" /> : <List className="w-3.5 h-3.5 mr-2" />}
                                Switch to {viewMode === 'list' ? 'Grid' : 'List'} View
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b bg-muted/20 px-4 py-2 flex items-center gap-1 text-xs font-bold shrink-0">
                        <button onClick={handleGoToRoot} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors text-primary">
                            <Box className="w-3 h-3" />{id}
                        </button>
                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={i}>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                <button onClick={() => handleBreadcrumbClick(i)} className="px-2 py-1 rounded hover:bg-muted transition-colors text-foreground">{crumb}</button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {viewMode === 'list' ? (
                            <div className="divide-y">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b bg-muted/30">
                                    <div className="col-span-6">Name</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Size</div>
                                    <div className="col-span-2">Modified</div>
                                </div>
                                {loading ? (
                                    <div className="p-8 space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm font-bold text-muted-foreground">This folder is empty</p>
                                    </div>
                                ) : (
                                    items.map((item, i) => {
                                        const Icon = item.is_folder ? Folder : getFileIcon(item.content_type || '');
                                        return (
                                            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-2.5 hover:bg-muted/30 cursor-pointer group transition-colors"
                                                onClick={() => handleNavigateFolder(item)}>
                                                <div className="col-span-6 flex items-center gap-3 min-w-0">
                                                    <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${item.is_folder ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-sm font-medium truncate">{item.display_name}</span>
                                                </div>
                                                <div className="col-span-2 flex items-center">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                                        {item.is_folder ? 'folder' : (item.content_type?.split('/')[1] || 'file')}
                                                    </Badge>
                                                </div>
                                                <div className="col-span-2 flex items-center">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {item.is_folder ? '—' : formatBytes(item.size || 0)}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex items-center justify-end">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {item.updated ? new Date(item.updated).toLocaleDateString() : '—'}
                                                    </span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {!item.is_folder && (
                                                                <DropdownMenuItem onClick={() => handleDownload(item)}>
                                                                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleMoveClick(item)}>
                                                                <MoveRight className="w-3.5 h-3.5 mr-2" /> Move
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(item)}>
                                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {loading ? (
                                    Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)
                                ) : items.length === 0 ? (
                                    <div className="col-span-full p-12 text-center">
                                        <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm font-bold text-muted-foreground">This folder is empty</p>
                                    </div>
                                ) : (
                                    items.map((item, i) => {
                                        const Icon = item.is_folder ? Folder : getFileIcon(item.content_type || '');
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/30 cursor-pointer group transition-colors border"
                                                onClick={() => handleNavigateFolder(item)}>
                                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${item.is_folder ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs font-medium text-center truncate w-full">{item.display_name}</span>
                                                {!item.is_folder && <span className="text-[10px] text-muted-foreground">{formatBytes(item.size || 0)}</span>}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`border-l bg-card overflow-y-auto shrink-0 transition-all ${hudCollapsed ? 'w-10' : 'w-80'}`}>
                    {hudCollapsed ? (
                        <Button variant="ghost" size="sm" className="h-full w-full rounded-none" onClick={() => setHudCollapsed(false)}>
                            <Terminal className="w-4 h-4" />
                        </Button>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs font-black uppercase tracking-widest">Integration</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHudCollapsed(true)}>
                                    <Info className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <AppIntegrationHUD bucketName={id || ''} region={config?.region || 'us-east-1'} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmModal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null })}
                resourceName={deleteName}
                resourceType={deleteType}
                onConfirm={confirmDelete}
                loading={deleteLoading}
            />
            <MoveModal
                open={moveModal.open}
                onClose={() => setMoveModal({ open: false, item: null })}
                currentPath={currentPath}
                items={items}
                onMove={confirmMove}
                loading={moveLoading}
            />
            {folderOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFolderOpen(false)}>
                    <div className="bg-card border rounded-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold flex items-center gap-2"><FolderPlus className="w-5 h-5" /> New Folder</h3>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Folder Name</label>
                            <Input value={folderName} onChange={(e) => setFolderName(e.target.value)}
                                placeholder="e.g. logs" autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setFolderOpen(false); setFolderName(''); }}>Cancel</Button>
                            <Button onClick={handleCreateFolder} disabled={!folderName.trim()}>Create Folder</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
