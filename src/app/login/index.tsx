import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Shield, 
    Zap, 
    Globe, 
    Lock,
    ArrowRight
} from 'lucide-react';

const LoginPage = () => {
    const handleLogin = () => {
        window.location.href = '/api/v1/auth/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[440px] z-10 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-border/50 flex items-center justify-center mb-2">
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">K1W1.</h1>
                        <p className="text-slate-500 font-medium tracking-tight mt-1">Cloud Control Plane</p>
                    </div>
                </div>

                <Card className="border-border/60 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="pt-10 pb-6 text-center">
                        <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Welcome Back</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Authentication required to access infrastructure.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-10 space-y-8">
                        <Button 
                            onClick={handleLogin}
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3 bg-white p-0.5 rounded-full" />
                            Sign in with Google
                        </Button>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="flex flex-col items-center gap-2 group cursor-default">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fast</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 group cursor-default">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 group cursor-default">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scalable</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center space-y-6">
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Terms</a>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacy</a>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Support</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
