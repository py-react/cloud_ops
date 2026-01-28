import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/libs/utils';

interface RedirectPageProps {
    message?: string;
    className?: string;
}

const RedirectPage: React.FC<RedirectPageProps> = ({
    message = "Redirecting...",
    className
}) => {
    return (
        <div className={cn(
            "w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-500",
            className
        )}>
            <div className="flex flex-col items-center gap-6 p-12 rounded-3xl bg-card shadow-2xl ring-1 ring-border/50 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />

                    {/* Rotating Gradient Border */}
                    <div className="relative p-1 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-purple-500 animate-spin-slow">
                        <div className="bg-card rounded-full p-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-xl font-black tracking-widest text-foreground uppercase">
                        {message}
                    </h2>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Preparing your workspace
                </p>
            </div>
        </div>
    );
};

export default RedirectPage;
