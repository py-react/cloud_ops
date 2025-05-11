import React,{ useState } from 'react';
import { Network } from './types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Network as NetworkIcon, Calendar, Globe2, SquareArrowOutUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/libs/utils';

interface NetworkCardProps {
  network: Network;
  onClick: () => void;
  onDelete: (id: string) => Promise<boolean>;
}

export function NetworkCard({ network, onClick, onDelete }: NetworkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(network.Id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "group border rounded-lg transition-all duration-200",
      "hover:bg-muted/50",
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <NetworkIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{network.Name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(network.Created), 'PPP')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="bg-primary/5">
                <Globe2 className="h-3 w-3 mr-1" />
                {network.Scope}
              </Badge>
              <Badge variant="outline" className="bg-primary/5">
                {network.Driver}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Network</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the network "{network.Name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClick}
            >
              <SquareArrowOutUpRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}