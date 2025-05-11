import React,{ useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Database, Tag, Clock, User, Lock, Unlock, FileText, Bookmark, ChevronDown, ChevronUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

type Time = string;

interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

interface ManagedFieldsEntry {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: Record<string, any>;
  manager?: string;
  operation?: string;
  subresource?: string;
  time?: Time;
}

export interface ConfigMap {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    uid?: string;
    creationTimestamp?: Time;
    deletionTimestamp?: Time;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: OwnerReference[];
    managedFields?: ManagedFieldsEntry[];
  };
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

interface ConfigMapTableProps {
  configMaps: ConfigMap[];
  onEdit: (configMap: ConfigMap) => void;
  onDelete: (configMap: ConfigMap) => void;
}

export function ConfigMapTable({ configMaps, onEdit, onDelete }: ConfigMapTableProps) {
  return (
    <div className="space-y-4 w-full">
      {configMaps.map((configMap) => (
        <ConfigMapCard key={configMap.metadata?.uid} configMap={configMap} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

function ConfigMapCard({ configMap, onEdit, onDelete }: { configMap: ConfigMap; onEdit: (configMap: ConfigMap) => void; onDelete: (configMap: ConfigMap) => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Card className="w-full p-4 border border-gray-200 rounded-lg">
      <CardHeader className="p-0 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{configMap.metadata?.name}</CardTitle>
            <CardDescription>{configMap.metadata?.namespace}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={configMap.immutable ? "secondary" : "default"} className='rounded'>
              {configMap.immutable ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
              {configMap.immutable ? 'Immutable' : 'Mutable'}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(configMap)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit ConfigMap</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(configMap)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete ConfigMap</p>
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
            <span>{new Date(configMap.metadata?.creationTimestamp || '').toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>{configMap.metadata?.ownerReferences?.length || 0} owners</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={expandedSection === 'data' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('data')}
          >
            <Database className="h-3 w-3 mr-1" />
            {Object.keys(configMap.data || {}).length} data
          </Badge>
          <Badge
            variant={expandedSection === 'binaryData' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('binaryData')}
          >
            <FileText className="h-3 w-3 mr-1" />
            {Object.keys(configMap.binaryData || {}).length} binary
          </Badge>
          <Badge
            variant={expandedSection === 'labels' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('labels')}
          >
            <Tag className="h-3 w-3 mr-1" />
            {Object.keys(configMap.metadata?.labels || {}).length} labels
          </Badge>
          <Badge
            variant={expandedSection === 'annotations' ? 'secondary' : 'outline'}
            className="flex items-center cursor-pointer"
            onClick={() => toggleSection('annotations')}
          >
            <Bookmark className="h-3 w-3 mr-1" />
            {Object.keys(configMap.metadata?.annotations || {}).length} annotations
          </Badge>
        </div>
        {expandedSection && (
          <ScrollArea className="h-[300px] w-full mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedSection === 'data' && Object.entries(configMap.data || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                    </TableCell>
                  </TableRow>
                ))}
                {expandedSection === 'binaryData' && Object.entries(configMap.binaryData || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>[binary data]</TableCell>
                  </TableRow>
                ))}
                {expandedSection === 'labels' && Object.entries(configMap.metadata?.labels || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
                {expandedSection === 'annotations' && Object.entries(configMap.metadata?.annotations || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                    </TableCell>
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

