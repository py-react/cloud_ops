import React,{ useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Box, Cpu, MemoryStickIcon as Memory, Clock, HardDrive } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface Pod {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
  };
  spec: {
    nodeName?: string;
  };
  status: {
    phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
    podIP?: string;
    startTime?: string;
    conditions?: Array<{
      type: string;
      status: string;
    }>;
    containerStatuses?: Array<{
      name: string;
      ready: boolean;
      restartCount: number;
      state: {
        running?: { startedAt: string };
        waiting?: { reason: string };
        terminated?: { reason: string; exitCode: number };
      };
    }>;
  };
}

interface PodTableProps {
  pods: Pod[];
  onEdit: (pod: Pod) => void;
  onDelete: (pod: Pod) => void;
}

export function PodTable({ pods, onEdit, onDelete }: PodTableProps) {
  return (
    <div className="space-y-4 w-full">
      {pods.map((pod) => (
        <PodCard key={pod.metadata.uid} pod={pod} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

function PodCard({ pod, onEdit, onDelete }: { pod: Pod; onEdit: (pod: Pod) => void; onDelete: (pod: Pod) => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Card className="w-full p-4 border border-gray-200 rounded-lg">
      <CardHeader className="p-0 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{pod.metadata.name}</CardTitle>
            <CardDescription>{pod.metadata.namespace}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className='rounded' variant={pod.status.phase === 'Running' ? "default" : "destructive"}>
              {pod.status.phase}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(pod)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Pod</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(pod)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Pod</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Created: {new Date(pod.metadata.creationTimestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <HardDrive className="h-4 w-4 mr-1" />
            <span>Node: {pod.spec.nodeName || 'Not assigned'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={expandedSection === 'status' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('status')}
          >
            <Box className="h-3 w-3 mr-1" />
            Status
          </Badge>
          <Badge
            variant={expandedSection === 'containers' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('containers')}
          >
            <Cpu className="h-3 w-3 mr-1" />
            Containers ({pod.status.containerStatuses?.length || 0})
          </Badge>
          <Badge
            variant={expandedSection === 'conditions' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('conditions')}
          >
            <Memory className="h-3 w-3 mr-1" />
            Conditions ({pod.status.conditions?.length || 0})
          </Badge>
        </div>
        {expandedSection && (
          <ScrollArea className="h-[300px] w-full mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {expandedSection === 'status' && (
                    <>
                      <TableHead>IP</TableHead>
                      <TableHead>Start Time</TableHead>
                    </>
                  )}
                  {expandedSection === 'containers' && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>Restarts</TableHead>
                      <TableHead>State</TableHead>
                    </>
                  )}
                  {expandedSection === 'conditions' && (
                    <>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedSection === 'status' && (
                  <TableRow>
                    <TableCell>{pod.status.podIP || 'N/A'}</TableCell>
                    <TableCell>{pod.status.startTime ? new Date(pod.status.startTime).toLocaleString() : 'N/A'}</TableCell>
                  </TableRow>
                )}
                {expandedSection === 'containers' && pod.status.containerStatuses?.map((container) => (
                  <TableRow key={container.name}>
                    <TableCell>{container.name}</TableCell>
                    <TableCell>{container.ready ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{container.restartCount}</TableCell>
                    <TableCell>
                      {container.state.running ? 'Running' :
                       container.state.waiting ? `Waiting (${container.state.waiting.reason})` :
                       container.state.terminated ? `Terminated (${container.state.terminated.reason}, exit code: ${container.state.terminated.exitCode})` :
                       'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
                {expandedSection === 'conditions' && pod.status.conditions?.map((condition) => (
                  <TableRow key={condition.type}>
                    <TableCell>{condition.type}</TableCell>
                    <TableCell>{condition.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

