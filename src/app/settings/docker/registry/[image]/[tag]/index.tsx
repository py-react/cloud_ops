import { DefaultService } from "@/gingerJs_api_client";
import { Editor } from "@monaco-editor/react";
import { ChevronDown, ChevronRight, Clock, Eye, FileText, FolderOpen, Layers, Loader2, Package, Settings, Tag as TagIcon, X, HardDrive } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/libs/utils";

interface ImageConfig {
  created: string
  architecture: string
  os: string
  config: {
    ExposedPorts?: Record<string, any>
    Env?: string[]
    Entrypoint?: string[]
    Cmd?: string[]
    WorkingDir?: string
    Labels?: Record<string, string>
    StopSignal?: string
  }
  rootfs: {
    type: string
    diff_ids: string[]
  }
  history: Array<{
    created: string
    created_by: string
    comment?: string
    empty_layer?: boolean
  }>
}

interface ImageManifest {
  mediaType: string
  schemaVersion: number
  config: {
    mediaType: string
    digest: string
    size: number
  }
  layers: Array<{
    mediaType: string
    digest: string
    size: number
  }>
}

interface FileContent {
  type: string
  sha256: string
  file_path: string
  size: number
  is_text: boolean
  content?: string
  download_url?: string
}

interface LayerContents {
  type: string
  sha256: string
  compressed_size: number
  summary: {
    total_entries: number
    files: number
    directories: number
    total_uncompressed_size: number
  }
  contents: Array<{
    name: string
    type: 'file' | 'directory' | 'symlink' | 'other'
    size: number
    mode: string
    uid: number
    gid: number
    mtime: number
    is_file: boolean
    is_dir: boolean
    is_symlink: boolean
    linkname?: string
  }>
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  mode: string
  mtime: number
  children?: TreeNode[]
  linkname?: string
  is_file: boolean
  is_dir: boolean
  is_symlink: boolean
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const Tag = () => {
  const { tag, image } = useParams()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const registryId = queryParams.get('registry_id')
  const registryName = queryParams.get('registry_name')

  // Detail view states
  const [imageManifest, setImageManifest] = useState<ImageManifest | null>(null)
  const [imageConfig, setImageConfig] = useState<ImageConfig | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // File viewing states
  const [fileContents, setFileContents] = useState<Record<string, FileContent>>({})
  const [expandedDirectories, setExpandedDirectories] = useState<Record<string, boolean>>({})
  const [fileLoading, setFileLoading] = useState<Record<string, boolean>>({})
  const [viewingFile, setViewingFile] = useState<string | null>(null)

  // Layer examination states
  const [layerContents, setLayerContents] = useState<Record<string, LayerContents>>({})
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({})
  const [layerLoading, setLayerLoading] = useState<Record<string, boolean>>({})

  // UI states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layers: true,
    environment: false,
    labels: false,
    history: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const examineLayer = async (layerDigest: string, repoName: string) => {
    if (layerContents[layerDigest]) {
      setExpandedLayers(prev => ({
        ...prev,
        [layerDigest]: !prev[layerDigest]
      }))
      return
    }

    try {
      setLayerLoading(prev => ({ ...prev, [layerDigest]: true }))
      const sha256 = layerDigest.replace('sha256:', '')
      const res = await fetch(`/api/docker/registry/examine?repo=${encodeURIComponent(repoName)}&sha256=${sha256}&action=list&registryId=${registryId || ''}`)
      const data = await res.json()

      if (data && data.type === 'layer') {
        setLayerContents(prev => ({
          ...prev,
          [layerDigest]: data as LayerContents
        }))
        setExpandedLayers(prev => ({
          ...prev,
          [layerDigest]: true
        }))
      } else {
        toast.error('Failed to examine layer - invalid response')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to examine layer')
    } finally {
      setLayerLoading(prev => ({ ...prev, [layerDigest]: false }))
    }
  }

  const fetchImageManifest = async () => {
    try {
      setDetailLoading(true)
      const res = await fetch(`/api/docker/registry?image_name=${encodeURIComponent(image!)}&tag=${tag}&registry_id=${registryId || ''}`)
      const manifest = await res.json()
      setImageManifest(manifest as ImageManifest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch image manifest')
    } finally {
      setDetailLoading(false)
    }
  }

  const calculateEditorHeight = (content: string): string => {
    const lines = content.split('\n').length
    const lineHeight = 19
    const padding = 16
    const minHeight = 40
    const maxHeight = 720
    return `${Math.max(minHeight, Math.min(maxHeight, lines * lineHeight + padding))}px`
  }

  const fetchImageConfig = async (configDigest: string) => {
    try {
      if (!imageConfig) {
        setDetailLoading(true)
        const res = await fetch(`/api/docker/registry?image_name=${encodeURIComponent(image!)}&blob=true&sha256_digest=${configDigest}&registry_id=${registryId || ''}`)
        const config = await res.json()
        setImageConfig(config as ImageConfig)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch image config')
    } finally {
      setDetailLoading(false)
    }
  }

  const viewFileContent = async (filePath: string, layerDigest: string, repoName: string) => {
    const fileKey = `${layerDigest}:${filePath}`
    if (fileContents[fileKey]) {
      setViewingFile(fileKey)
      return
    }

    try {
      setFileLoading(prev => ({ ...prev, [fileKey]: true }))
      const sha256 = layerDigest.replace('sha256:', '')
      const res = await fetch(`/api/docker/registry/examine?repo=${encodeURIComponent(repoName)}&sha256=${sha256}&action=file&file_path=${encodeURIComponent(filePath)}&registryId=${registryId || ''}`)
      const data = await res.json()

      if (data && data.type === 'file') {
        setFileContents(prev => ({
          ...prev,
          [fileKey]: data as FileContent
        }))
        setViewingFile(fileKey)
      } else {
        toast.error('Failed to load file content')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setFileLoading(prev => ({ ...prev, [fileKey]: false }))
    }
  }

  const toggleDirectory = (dirKey: string) => {
    setExpandedDirectories(prev => ({
      ...prev,
      [dirKey]: !prev[dirKey]
    }))
  }

  const closeFileViewer = () => {
    setViewingFile(null)
  }

  const parseDockerfileCommand = (createdBy: string): { command: string; isShellCommand: boolean } => {
    let command = createdBy
      .replace(/^\/bin\/sh -c #\(nop\)\s*/, '')
      .replace(/^\/bin\/sh -c /, 'RUN ')
      .replace(/^ADD /, 'ADD ')
      .replace(/^COPY /, 'COPY ')
      .trim()

    const isShellCommand = command.startsWith('RUN ') && (
      command.includes('&&') ||
      command.includes('||') ||
      command.includes('|') ||
      command.includes(';') ||
      command.length > 100
    )

    return { command, isShellCommand }
  }

  const formatShellCommand = (command: string): string => {
    if (!command.startsWith('RUN ')) return command
    const shellPart = command.substring(4)
    return shellPart
      .split(' && ')
      .map((part, index) => {
        if (index === 0) return `RUN ${part.trim()}`
        return `    && ${part.trim()}`
      })
      .join(' \\\n')
  }

  const toggleLayerContents = (layerDigest: string) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerDigest]: !prev[layerDigest]
    }))
  }

  const buildFileTree = (files: LayerContents['contents']): TreeNode[] => {
    const tree: TreeNode[] = []
    const nodeMap = new Map<string, TreeNode>()
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

    for (const file of sortedFiles) {
      const parts = file.name.split('/').filter(part => part !== '')
      let currentPath = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!nodeMap.has(currentPath)) {
          const isLastPart = i === parts.length - 1
          const nodeType = isLastPart
            ? (file.type === 'other' ? 'file' : file.type as 'file' | 'directory' | 'symlink')
            : 'directory'

          const node: TreeNode = {
            name: part,
            path: currentPath,
            type: nodeType,
            size: isLastPart ? file.size : 0,
            mode: isLastPart ? file.mode : '0755',
            mtime: isLastPart ? file.mtime : Date.now() / 1000,
            children: nodeType === 'directory' ? [] : undefined,
            linkname: isLastPart ? file.linkname : undefined,
            is_file: isLastPart ? file.is_file : false,
            is_dir: nodeType === 'directory',
            is_symlink: isLastPart ? file.is_symlink : false
          }

          nodeMap.set(currentPath, node)
          if (parentPath) {
            const parent = nodeMap.get(parentPath)
            if (parent && parent.children) parent.children.push(node)
          } else {
            tree.push(node)
          }
        }
      }
    }
    return tree
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  const TreeView: React.FC<{
    nodes: TreeNode[];
    layerDigest: string;
    repoName: string;
    depth: number;
  }> = ({ nodes, layerDigest, repoName, depth }) => {
    return (
      <div>
        {nodes.map((node, index) => {
          const dirKey = `${layerDigest}:${node.path}`;
          const fileKey = `${layerDigest}:${node.path}`;
          const isExpanded = expandedDirectories[dirKey];

          return (
            <div key={index} style={{ marginLeft: `${depth * 16}px` }}>
              <div className="flex items-center py-1 hover:bg-gray-50 rounded">
                {node.is_dir && (
                  <button
                    className="w-4 h-4 mr-1 flex items-center justify-center text-gray-500 hover:text-gray-700"
                    onClick={() => toggleDirectory(dirKey)}
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                <div
                  className={cn("flex items-center gap-1 flex-1", node.is_file && "cursor-pointer hover:text-blue-600")}
                  onClick={() => {
                    if (node.is_file) viewFileContent(node.path, layerDigest, repoName);
                    else if (node.is_dir) toggleDirectory(dirKey);
                  }}
                >
                  <span className="text-sm">{node.is_dir ? "📁" : node.is_symlink ? "🔗" : "📄"}</span>
                  <span className="font-mono text-xs text-gray-700">{node.name}</span>
                  {node.linkname && <span className="text-gray-500 text-xs">→ {node.linkname}</span>}
                  {fileLoading[fileKey] && <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-1" />}
                </div>
                <div className="text-xs text-gray-500 min-w-16 text-right">
                  {node.is_file ? formatBytes(node.size) : ""}
                </div>
              </div>
              {node.is_dir && isExpanded && node.children && (
                <TreeView
                  nodes={node.children}
                  layerDigest={layerDigest}
                  repoName={repoName}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    fetchImageManifest()
  }, [image, tag, registryId])

  return (
    <PageLayout
      title={`${image}:${tag}`}
      subtitle={
        <>
          Detailed inspection for <span className="text-primary font-bold">{image}</span> in <span className="text-primary font-bold">{registryName || 'Registry'}</span>
        </>
      }
      icon={Package}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={fetchImageManifest} disabled={detailLoading}>
            <Loader2 className={cn("w-3.5 h-3.5 mr-2", detailLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <ResourceCard
          title="Layers"
          count={imageManifest?.layers.length || 0}
          icon={<Layers className="w-4 h-4" />}
          color="bg-purple-500"
          className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
          isLoading={detailLoading}
        />
        <ResourceCard
          title="Architecture"
          count={imageConfig?.architecture || "..."}
          icon={<Settings className="w-4 h-4" />}
          color="bg-blue-500"
          className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          isLoading={detailLoading}
        />
        <ResourceCard
          title="OS"
          count={imageConfig?.os || "..."}
          icon={<TagIcon className="w-4 h-4" />}
          color="bg-emerald-500"
          className="border-emerald-500/20 bg-emerald-500/5 shadow-none hover:border-emerald-500/30 transition-all"
          isLoading={detailLoading}
        />
        <ResourceCard
          title="Media Type"
          count={imageManifest?.mediaType ? (imageManifest.mediaType.split('.').pop() || "...") : "..."}
          icon={<FileText className="w-4 h-4" />}
          color="bg-orange-500"
          className="border-orange-500/20 bg-orange-500/5 shadow-none hover:border-orange-500/30 transition-all"
          isLoading={detailLoading}
        />
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 pb-10">
        {/* Image Overview Card */}
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>Image Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Media Type</div>
                <div className="text-gray-600">{imageManifest?.mediaType}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Schema Version</div>
                <div className="text-gray-600">{imageManifest?.schemaVersion}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Layers</div>
                <div className="text-gray-600">{imageManifest?.layers.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layers Section */}
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleSection('layers')}
              >
                <Layers className="w-5 h-5 text-blue-500" />
                Layers ({imageManifest?.layers.length})
                {expandedSections.layers ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </CardTitle>
            </div>
          </CardHeader>
          {expandedSections.layers && (
            <CardContent className="space-y-3">
              {imageManifest?.layers.map((layer, index) => (
                <div key={index} className="border rounded-lg bg-gray-50">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-700">Layer {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{formatBytes(layer.size)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => examineLayer(layer.digest, image!)}
                          disabled={layerLoading[layer.digest]}
                        >
                          {layerLoading[layer.digest] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <FolderOpen className="w-4 h-4 mr-1" />
                              {layerContents[layer.digest] ? 'Toggle' : 'Examine'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-gray-500 break-all">{layer.digest}</div>
                    <div className="text-xs text-gray-500 mt-1">{layer.mediaType}</div>
                  </div>
                  {layerContents[layer.digest] && expandedLayers[layer.digest] && (
                    <div className="border-t bg-white">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-800">Layer Contents</h4>
                          <Button variant="ghost" size="sm" onClick={() => toggleLayerContents(layer.digest)}>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="font-medium text-blue-700">Total Entries</div>
                            <div className="text-blue-600">{layerContents[layer.digest].summary.total_entries}</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="font-medium text-green-700">Files</div>
                            <div className="text-green-600">{layerContents[layer.digest].summary.files}</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <div className="font-medium text-yellow-700">Directories</div>
                            <div className="text-yellow-600">{layerContents[layer.digest].summary.directories}</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <div className="font-medium text-purple-700">Uncompressed Size</div>
                            <div className="text-purple-600">{formatBytes(layerContents[layer.digest].summary.total_uncompressed_size)}</div>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto border rounded p-3 bg-gray-50">
                          <TreeView
                            nodes={buildFileTree(layerContents[layer.digest].contents)}
                            layerDigest={layer.digest}
                            repoName={image!}
                            depth={0}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Config Section */}
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                Configuration
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => fetchImageConfig(imageManifest?.config.digest!)}
                disabled={detailLoading || !imageManifest}
              >
                {detailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Load Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Config Digest</div>
                <div className="text-xs font-mono text-gray-600 break-all">{imageManifest?.config.digest}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Config Size</div>
                <div className="text-gray-600">{formatBytes(imageManifest?.config?.size! || 0)}</div>
              </div>
            </div>
            {imageConfig && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-700">Architecture</div>
                    <div className="text-blue-600">{imageConfig?.architecture}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-700">OS</div>
                    <div className="text-blue-600">{imageConfig?.os}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-700">Created</div>
                    <div className="text-blue-600 text-sm">{formatDate(imageConfig?.created!)}</div>
                  </div>
                </div>
                {/* Environment Variables */}
                {imageConfig.config.Env && (
                  <div className="border rounded-lg">
                    <div className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between" onClick={() => toggleSection('environment')}>
                      <span className="font-medium text-gray-700">Environment Variables ({imageConfig.config.Env.length})</span>
                      {expandedSections.environment ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    {expandedSections.environment && (
                      <div className="p-3 space-y-2">
                        {imageConfig.config.Env.map((env, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded font-mono text-sm">{env}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Labels */}
                {imageConfig.config.Labels && Object.keys(imageConfig.config.Labels).length > 0 && (
                  <div className="border rounded-lg">
                    <div className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between" onClick={() => toggleSection('labels')}>
                      <span className="font-medium text-gray-700">Labels ({Object.keys(imageConfig.config.Labels).length})</span>
                      {expandedSections.labels ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    {expandedSections.labels && (
                      <div className="p-3 space-y-2">
                        {Object.entries(imageConfig.config.Labels || {}).map(([key, value], index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded">
                            <div className="font-mono text-sm text-gray-700">{key}</div>
                            <div className="font-mono text-sm text-gray-600">{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* History */}
                <div className="border rounded-lg">
                  <div className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between" onClick={() => toggleSection('history')}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium text-gray-700">Build History ({imageConfig.history.length})</span>
                    </div>
                    {expandedSections.history ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  {expandedSections.history && (
                    <div className="p-3 space-y-3">
                      {imageConfig.history.map((step, index) => {
                        const { command, isShellCommand } = parseDockerfileCommand(step.created_by)
                        const displayCommand = isShellCommand ? formatShellCommand(command) : command
                        return (
                          <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Step {index + 1}</span>
                                {step.empty_layer && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Empty Layer</span>}
                              </div>
                              <div className="text-xs text-gray-500">{formatDate(step.created)}</div>
                            </div>
                            {step.comment && <div className="text-xs text-gray-500 italic mb-2">{step.comment}</div>}
                            <div className="border rounded overflow-hidden">
                              <Editor height={calculateEditorHeight(displayCommand)} defaultLanguage="dockerfile" theme="vs-light" value={displayCommand} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'off', folding: false, contextmenu: false, automaticLayout: true, padding: { top: 8, bottom: 8 }, renderLineHighlight: 'none' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Content Viewer Modal */}
        {viewingFile && fileContents[viewingFile] && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[80vh] max-h-[900px] flex flex-col overflow-hidden border border-border/30">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{fileContents[viewingFile].file_path.split('/').pop()}</h3>
                    <p className="text-xs text-gray-500">{fileContents[viewingFile].file_path}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeFileViewer} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden bg-[#fffffe]">
                {fileContents[viewingFile].is_text ? (
                  <Editor height="100%" defaultLanguage="plaintext" theme="vs-light" value={fileContents[viewingFile].content || ''} options={{ readOnly: true, minimap: { enabled: true }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 16, bottom: 16 } }} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                    <HardDrive className="w-16 h-16 opacity-20" />
                    <p className="font-medium text-lg text-gray-400">Binary file cannot be displayed</p>
                    <p className="text-sm opacity-60">Size: {formatBytes(fileContents[viewingFile].size)}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
                <Button onClick={closeFileViewer} variant="secondary">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default Tag
