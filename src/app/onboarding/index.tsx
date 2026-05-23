import React, { useState, useEffect } from 'react';
import {
    Check,
    Rocket,
    ChevronRight,
    ChevronLeft,
    Cloud,
    Container,
    Terminal,
    Shield,
    Database,
    Zap,
    ExternalLink,
    AlertCircle,
    Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getAuthToken } from '@/libs/auth';
import useNavigate from '@/libs/navigate';

const STEPS = [
    { id: 'welcome', title: 'Welcome', icon: Zap },
    { id: 'docker', title: 'Docker Engine', icon: Container },
    { id: 'kubernetes', title: 'Kubernetes', icon: Cloud },
    { id: 'helm', title: 'Helm Setup', icon: Package },
    { id: 'finish', title: 'Get Started', icon: Rocket }
];

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Token is now handled via cookies and the root Layout
    }, []);
    const [installingTool, setInstallingTool] = useState<string | null>(null);

    // Form States
    const [dockerConfig, setDockerConfig] = useState({ name: 'Default Engine', base_url: 'unix:///var/run/docker.sock' });
    const [kubeFile, setKubeFile] = useState<File | null>(null);

    // Tool Status
    const [dockerStatus, setDockerStatus] = useState<{ installed: boolean | null, checking: boolean }>({ installed: null, checking: false });
    const [helmStatus, setHelmStatus] = useState<{ installed: boolean | null, checking: boolean }>({ installed: null, checking: false });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const checkTool = async (tool: 'docker' | 'helm') => {
        const setStatus = tool === 'docker' ? setDockerStatus : setHelmStatus;
        setStatus(prev => ({ ...prev, checking: true }));
        const token = getAuthToken();
        try {
            const res = await fetch(`/api/system/install?tool=${tool}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStatus({ installed: data.is_installed, checking: false });
            return data.is_installed;
        } catch (error) {
            console.error(`Failed to check ${tool}:`, error);
            setStatus(prev => ({ ...prev, checking: false }));
            return null;
        }
    };

    const installTool = async (tool: 'docker' | 'helm') => {
        setInstallingTool(tool);
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch('/api/system/install', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tool })
            });
            const data = await res.json();
            if (!data.error) {
                toast.info(data.message);
                // Start polling
                const interval = setInterval(async () => {
                    const isInstalled = await checkTool(tool);
                    if (isInstalled) {
                        toast.success(`${tool.charAt(0).toUpperCase() + tool.slice(1)} installation complete!`);
                        setInstallingTool(null);
                        setLoading(false);
                        clearInterval(interval);
                    }
                }, 5000);
            } else {
                toast.error(data.message);
                setInstallingTool(null);
                setLoading(false);
            }
        } catch (error) {
            toast.error(`Error starting ${tool} installation`);
            setInstallingTool(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentStep === 1) checkTool('docker');
        if (currentStep === 3) checkTool('helm');
    }, [currentStep]);

    const completeOnboarding = async () => {
        setLoading(true);
        const token = getAuthToken();
        try {
            const res = await fetch('/api/system/onboarding', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: "Primary Tenant" })
            });
            if (res.ok) {
                toast.success('Onboarding complete! Welcome to Cloud Ops.');
                navigate('/');
            } else {
                toast.error('Failed to save setup status');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDockerSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/docker/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dockerConfig, is_active: true, is_default: true })
            });
            if (res.ok) {
                toast.success('Docker Engine configured');
                nextStep();
            } else {
                toast.error('Failed to save Docker configuration');
            }
        } catch (error) {
            toast.error('Error connecting to Docker Engine API');
        } finally {
            setLoading(false);
        }
    };

    const handleKubeSubmit = async () => {
        if (!kubeFile) {
            nextStep(); // Allow skipping
            return;
        }
        setLoading(true);
        try {
            const content = await kubeFile.text();
            const res = await fetch('/api/kubernertes/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Primary Cluster',
                    content: content
                })
            });
            if (res.ok) {
                toast.success('Kubeconfig uploaded successfully');
                nextStep();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to upload Kubeconfig');
            }
        } catch (error) {
            toast.error('Error uploading file');
        } finally {
            setLoading(false);
        }
    };


    const progressValue = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-2xl">
                {/* Stepper Header */}
                <div className="mb-10 px-4">
                    <div className="flex justify-between items-center relative">
                        {/* Dynamic Connecting Line */}
                        <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-200 -z-10">
                            <div
                                className="h-full bg-slate-900 transition-all duration-500 ease-in-out"
                                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>

                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = idx === currentStep;
                            const isCompleted = idx < currentStep;
                            return (
                                <div key={step.id} className="flex flex-col items-center space-y-2 bg-slate-50 px-2">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-lg shadow-slate-200' :
                                            isCompleted ? 'bg-white border-slate-900 text-slate-900' : 'bg-white border-slate-200 text-slate-400'
                                        }`}>
                                        {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-2xl">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black tracking-tighter">
                                STEP {currentStep + 1} OF {STEPS.length}
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-black text-foreground tracking-tight leading-none uppercase">
                            {currentStep === 0 && "Welcome"}
                            {currentStep === 1 && "Docker Engine"}
                            {currentStep === 2 && "Kubernetes"}
                            {currentStep === 3 && "Helm Setup"}
                            {currentStep === 4 && "Ready to Launch"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm font-medium mt-2">
                            {currentStep === 0 && "Let's set up your infrastructure command center."}
                            {currentStep === 1 && "Connect to your Docker daemon to manage builds."}
                            {currentStep === 2 && "Upload your kubeconfig to orchestrate clusters."}
                            {currentStep === 3 && "Verify Helm availability for cluster addons."}
                            {currentStep === 4 && "Everything is configured. You're ready to start."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-4 min-h-[260px] flex flex-col">
                        {/* Welcome Step */}
                        {currentStep === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Zap className="w-10 h-10 fill-primary/20" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto">
                                        K1W1 provides a centralized control plane for your containers, clusters, and deployments.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <Badge variant="secondary" className="font-bold text-[10px] py-1">SECURE</Badge>
                                        <Badge variant="secondary" className="font-bold text-[10px] py-1">API-FIRST</Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Docker Step */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {dockerStatus.installed === false && (
                                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col space-y-3">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-orange-500" />
                                            <p className="text-sm font-bold text-orange-700">Docker not found on system</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">We couldn't detect a local Docker installation. You can install it now or connect to a remote engine below.</p>
                                        <Button
                                            size="sm"
                                            onClick={() => installTool('docker')}
                                            disabled={loading}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px]"
                                        >
                                            {installingTool === 'docker' ? "Installing..." : "Install Docker Desktop"}
                                        </Button>
                                    </div>
                                )}

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engine Name</Label>
                                        <Input
                                            placeholder="e.g. Local Desktop"
                                            value={dockerConfig.name}
                                            onChange={e => setDockerConfig({ ...dockerConfig, name: e.target.value })}
                                            className="font-bold border-border/40 focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base URL</Label>
                                        <Input
                                            placeholder="unix:///var/run/docker.sock"
                                            value={dockerConfig.base_url}
                                            onChange={e => setDockerConfig({ ...dockerConfig, base_url: e.target.value })}
                                            className="font-mono text-sm border-border/40 focus:border-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* K8s Step */}
                        {currentStep === 2 && (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                <div className={`w-full p-8 border border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer ${kubeFile ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border/60 hover:border-border'
                                    }`}>
                                    <input
                                        type="file"
                                        id="kube-upload"
                                        className="hidden"
                                        onChange={e => setKubeFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="kube-upload" className="cursor-pointer flex flex-col items-center">
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-3 ${kubeFile ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Cloud className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-sm font-black">{kubeFile ? kubeFile.name : "Upload Kubeconfig"}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">
                                            {kubeFile ? "Click to change" : "YAML or JSON format"}
                                        </p>
                                    </label>
                                </div>
                            </div>
                        )}


                        {/* Helm Step */}
                        {currentStep === 3 && (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="p-6 rounded-xl bg-muted/20 border border-border/50 flex flex-col items-center text-center space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Status</span>
                                        <Badge className={helmStatus.installed === true ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-muted text-muted-foreground'}>
                                            {helmStatus.installed === true ? "AVAILABLE" : helmStatus.installed === false ? "NOT FOUND" : "PENDING"}
                                        </Badge>
                                    </div>
                                    <div className="p-6 rounded-xl bg-muted/20 border border-border/50 flex flex-col items-center text-center space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[10px] font-black border-border/60"
                                            onClick={() => checkTool('helm')}
                                            disabled={loading || helmStatus.checking}
                                        >
                                            {helmStatus.checking ? "CHECKING..." : "RE-VERIFY"}
                                        </Button>
                                    </div>
                                </div>

                                {helmStatus.installed === false && (
                                    <div className="w-full p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-5 h-5 text-blue-500" />
                                            <p className="text-sm font-bold text-blue-700">Helm is missing</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Helm is required for managing cluster addons like Prometheus and Loki.</p>
                                        <Button
                                            size="sm"
                                            onClick={() => installTool('helm')}
                                            disabled={loading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px]"
                                        >
                                            {installingTool === 'helm' ? "Installing..." : "Install Helm Now"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Finish Step */}
                        {currentStep === 4 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                    <Rocket className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black tracking-tight uppercase">Platform Ready</h2>
                                    <p className="text-muted-foreground text-sm font-medium">
                                        You're all set to manage your cloud operations.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0 || loading}
                            className="text-muted-foreground font-bold"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        <div className="flex gap-2">
                            {currentStep !== 4 && (
                                <Button
                                    variant="ghost"
                                    onClick={nextStep}
                                    disabled={loading}
                                    className="font-bold text-muted-foreground/60 hover:text-muted-foreground"
                                >
                                    Skip Step
                                </Button>
                            )}

                            {currentStep === 1 ? (
                                <Button onClick={handleDockerSubmit} disabled={loading} className="font-black px-6">
                                    {loading ? "Saving..." : "Connect"} <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : currentStep === 2 ? (
                                <Button onClick={handleKubeSubmit} disabled={!kubeFile || loading} className="font-black px-6">
                                    {loading ? "Uploading..." : "Save"} <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : currentStep === 4 ? (
                                <Button onClick={completeOnboarding} disabled={loading} className="font-black px-10 bg-emerald-600 hover:bg-emerald-700">
                                    {loading ? "Starting..." : "Go to Dashboard"}
                                </Button>
                            ) : (
                                <Button onClick={nextStep} disabled={loading} className="font-black px-6">
                                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Onboarding;
