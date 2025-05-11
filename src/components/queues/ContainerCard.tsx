import React from 'react';
import { Container } from './types/container';
import { Play, Square, Terminal, StopCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components//ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';
import { formatDistanceToNow } from 'date-fns';
import SmartDataViewer from './queueJob/SmartDataViewer';

interface ContainerCardProps {
  container: Container;
  onRemove: (containerId: string) => void;
}

export function ContainerCard({ container, onRemove }: ContainerCardProps) {
  const isRunning = container.status === 'running';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <Play className="w-4 h-4 text-green-500" />
            ) : (
              <Square className="w-4 h-4 text-red-500" />
            )}
            <CardTitle className="text-lg">{container.prefix}:{container.queueName}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onRemove(container.id)}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Created at: {formatDistanceToNow(container.created, { addSuffix: true })}</span>
          
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Last stopped: {formatDistanceToNow(new Date(container.finishedAt), {addSuffix: true})}</span>
          
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Processor: {container.processor}</span>
          <span>•</span>
          <span className={cn(
            "font-medium",
            isRunning ? "text-green-600" : "text-red-600"
          )}>
            {container.status}
          </span>
        </div>
        <div className="text-muted-foreground">
        <SmartDataViewer data={container.queueProps} label='Props'  initiallyOpen={false}/>
        </div>
        {container.logs && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Terminal className="w-4 h-4 mr-2" />
              <span>Recent Logs</span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 text-xs font-mono overflow-x-auto">
              {container.logs}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}