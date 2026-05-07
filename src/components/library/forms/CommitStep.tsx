import React from 'react';
import { History, MessageSquare } from 'lucide-react';
import { Label } from "@/components/ui/label";

export const getCommitStep = (placeholder: string = "Describe your changes...") => ({
    id: 'commit',
    label: 'Review & Commit',
    description: 'Add a message',
    longDescription: 'Provide a brief description of your changes for the audit trail. This helps other team members understand the history of this configuration.',
    icon: History,
    component: ({ form }: any) => (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground">Why are you making this change?</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Your message will be saved in the Git history and visible in the audit timeline.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Commit Message
                </Label>
                <textarea
                    {...form.register('commit_message')}
                    placeholder={placeholder}
                    autoFocus
                    className="w-full h-40 bg-muted/20 border border-border/40 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium leading-relaxed"
                />
                <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-muted-foreground/60 italic font-medium uppercase tracking-tighter">
                        Optional but recommended
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 font-mono">
                        {form.watch('commit_message')?.length || 0} characters
                    </p>
                </div>
            </div>
        </div>
    )
});
