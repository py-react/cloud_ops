import React from "react";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResourceType } from "@/hooks/useResourceLink";

interface Dependent {
    id: number;
    name: string;
    type: ResourceType;
}

interface DeleteDependencyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    resourceName: string;
    resourceType: string;
    dependents: Dependent[];
}

export const DeleteDependencyDialog: React.FC<DeleteDependencyDialogProps> = ({
    isOpen,
    onClose,
    resourceName,
    resourceType,
    dependents
}) => {
    const handleOpenDependent = (dep: Dependent) => {
        const url = `${window.location.pathname}?focusId=${dep.id}&resourceType=${dep.type}&autoOpen=true`;
        window.open(url, "_blank");
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Deletion Blocked
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                        <p className="text-foreground/80">
                            The {resourceType} <span className="font-bold text-foreground">"{resourceName}"</span> cannot be deleted because it is currently linked to the following resources:
                        </p>

                        <ScrollArea className="h-40 w-full rounded-md border border-border/40 bg-muted/20 p-2">
                            <div className="space-y-2">
                                {dependents.map((dep) => (
                                    <div
                                        key={dep.id}
                                        className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/30 hover:border-primary/30 group transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground uppercase tracking-tight">{dep.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{dep.type}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 opacity-60 group-hover:opacity-100"
                                            onClick={() => handleOpenDependent(dep)}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                            <span className="text-[10px] font-bold">Inspect</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 flex gap-3">
                            <Info className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 font-medium">
                                Please remove or unlink this {resourceType} from all dependent Pods before attempting to delete it again.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogAction onClick={onClose} className="bg-muted hover:bg-muted/80 text-foreground border-none">
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
