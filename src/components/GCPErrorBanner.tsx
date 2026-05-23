import React from 'react';
import { AlertCircle, ShieldAlert, CreditCard, RefreshCw, LogOut, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface GCPError {
    status: string;
    error_type: 'GCP_INSUFFICIENT_PERMISSIONS' | 'GCP_BILLING_REQUIRED' | 'GCP_SCOPE_MISMATCH' | 'GCP_API_NOT_ENABLED' | 'GCP_UNKNOWN_ERROR';
    message: string;
    action_required: string;
    project_id?: string;
    service_name?: string;
}

interface GCPErrorBannerProps {
    error: GCPError;
    onRetry?: () => void;
}

export const GCPErrorBanner: React.FC<GCPErrorBannerProps> = ({ error, onRetry }) => {
    const getIcon = () => {
        switch (error.error_type) {
            case 'GCP_INSUFFICIENT_PERMISSIONS': return <ShieldAlert className="h-5 w-5 text-orange-600" />;
            case 'GCP_BILLING_REQUIRED': return <CreditCard className="h-5 w-5 text-red-600" />;
            case 'GCP_SCOPE_MISMATCH': return <LogOut className="h-5 w-5 text-blue-600" />;
            default: return <AlertCircle className="h-5 w-5 text-slate-600" />;
        }
    };

    const getBgColor = () => {
        switch (error.error_type) {
            case 'GCP_INSUFFICIENT_PERMISSIONS': return 'bg-orange-50 border-orange-200';
            case 'GCP_BILLING_REQUIRED': return 'bg-red-50 border-red-200';
            case 'GCP_SCOPE_MISMATCH': return 'bg-blue-50 border-blue-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    const handleSignOut = async () => {
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch {
            // fallback: clear cookie directly
            document.cookie = "k1w1_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        window.location.href = '/login';
    };

    return (
        <Card className={`overflow-hidden border-2 ${getBgColor()} transition-all duration-300`}>
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="mt-1">{getIcon()}</div>
                    <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                            {error.error_type.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {error.message}
                        </p>
                    </div>
                </div>

                <div className="pl-9 space-y-4">
                    <div className="p-3 rounded-md border border-current/20 bg-white/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Action Required</p>
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">
                            {error.action_required}
                        </p>
                        {error.service_name && (
                            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-current/10">
                                <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                                    Affected Service: <span className="text-slate-900 font-black">{error.service_name}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {error.error_type === 'GCP_SCOPE_MISMATCH' || error.message.toLowerCase().includes('insufficient authentication scopes') ? (
                            <Button 
                                onClick={handleSignOut}
                                className="h-9 bg-slate-900 text-white rounded-md px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                <LogOut className="w-3 h-3 mr-2" /> Re-Authenticate
                            </Button>
                        ) : (
                            <Button 
                                onClick={onRetry}
                                variant="outline"
                                className="h-9 bg-white text-slate-900 rounded-md px-6 text-[10px] font-black uppercase tracking-widest border-slate-200"
                            >
                                <RefreshCw className="w-3 h-3 mr-2" /> Retry Operation
                            </Button>
                        )}
                        
                        {error.error_type === 'GCP_API_NOT_ENABLED' && error.service_name && error.project_id ? (
                            <Button 
                                onClick={() => {
                                    const serviceToEnable = error.message.toLowerCase().includes('service usage api') 
                                        ? 'serviceusage.googleapis.com' 
                                        : error.service_name;
                                    window.open(`https://console.cloud.google.com/apis/library/${serviceToEnable}?project=${error.project_id}`, '_blank');
                                }}
                                className="h-9 bg-blue-600 text-white hover:bg-blue-700 rounded-md px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Enable API in Console
                            </Button>
                        ) : error.error_type === 'GCP_BILLING_REQUIRED' && error.project_id ? (
                            <Button 
                                onClick={() => window.open(`https://console.cloud.google.com/billing?project=${error.project_id}`, '_blank')}
                                className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Manage Billing
                            </Button>
                        ) : error.service_name && error.project_id ? (
                            <Button 
                                onClick={() => window.open(`https://console.cloud.google.com/apis/library/${error.service_name}?project=${error.project_id}`, '_blank')}
                                className="h-9 bg-blue-600 text-white hover:bg-blue-700 rounded-md px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Manage {error.service_name.split('.')[0].toUpperCase()} API
                            </Button>
                        ) : error.error_type === 'GCP_INSUFFICIENT_PERMISSIONS' && error.project_id ? (
                            <Button 
                                onClick={() => window.open(`https://console.cloud.google.com/iam-admin/iam?project=${error.project_id}`, '_blank')}
                                className="h-9 bg-orange-600 text-white hover:bg-orange-700 rounded-md px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Manage IAM Permissions
                            </Button>
                        ) : (
                            <Button 
                                variant="ghost"
                                onClick={() => window.open(`https://console.cloud.google.com/home/dashboard${error.project_id ? `?project=${error.project_id}` : ''}`, '_blank')}
                                className="h-9 text-slate-500 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> Open Console
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

// Helper card wrapper if Card is not available in the component context
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-md border ${className}`}>
        {children}
    </div>
);
