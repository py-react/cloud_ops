import React, { useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CommitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (message: string) => Promise<void>;
    title?: string;
    description?: string;
    placeholder?: string;
}

export const CommitDialog: React.FC<CommitDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Commit Changes",
    description = "Provide a brief description of your changes for the audit history.",
    placeholder = "Describe what changed..."
}) => {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(message);
            setMessage(""); // Reset for next time
            onClose();
        } catch (error) {
            // Error should be handled by onConfirm (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/40 shadow-xl">
                <DialogHeader className="py-5 px-6 border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <History className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">
                            Commit Message
                        </Label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                            className="w-full h-32 bg-muted/10 border border-border/40 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/40 font-medium leading-relaxed"
                        />
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] text-muted-foreground/60 italic font-medium">
                                Optional: Leave blank to use system default
                            </p>
                            <p className="text-[10px] text-muted-foreground/40 font-mono">
                                {message.length} chars
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 px-6 border-t bg-muted/5 gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting}
                        variant="gradient"
                        size="sm"
                        className="font-black uppercase tracking-widest text-[10px] min-w-[140px] shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : (
                            "Confirm & Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

