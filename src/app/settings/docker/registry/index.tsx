import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Monitor, Loader2, ArrowLeft, Eye, Package, Clock, Tag, Layers, Settings, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'
import { Editor } from "@monaco-editor/react"
import RouteDescription from '@/components/route-description'
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'

// Type definitions
interface RegistryResponse {
  repositories: string[]
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

interface FileContent {
  type: string
  sha256: string
  file_path: string
  size: number
  is_text: boolean
  content?: string
  download_url?: string
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

// Define columns for ResourceTable
const repositoryColumns = [
  { header: 'Repository Name', accessor: 'name' },
  { header: 'Type', accessor: 'type' },
]

const tagColumns = [
  { header: 'Tag Name', accessor: 'name' },
]

type ViewState = 'repositories' | 'image-tags' | 'image-details'

const Registry = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repositories, setRepositories] = useState<string[]>([])
  const [isRegistryInitialized, setIsRegistryInitialized] = useState(false)
  
  // Detail view states
  const [viewState, setViewState] = useState<ViewState>('repositories')
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null)
  const [imageTags, setImageTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [imageManifest, setImageManifest] = useState<ImageManifest | null>(null)
  const [imageConfig, setImageConfig] = useState<ImageConfig | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // Layer examination states
  const [layerContents, setLayerContents] = useState<Record<string, LayerContents>>({})
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({})
  const [layerLoading, setLayerLoading] = useState<Record<string, boolean>>({})
  
  // File viewing states
  const [fileContents, setFileContents] = useState<Record<string, FileContent>>({})
  const [expandedDirectories, setExpandedDirectories] = useState<Record<string, boolean>>({})
  const [fileLoading, setFileLoading] = useState<Record<string, boolean>>({})
  const [viewingFile, setViewingFile] = useState<string | null>(null)
  
  // UI states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layers: true,
    environment: false,
    labels: false,
    history: false
  })

  // API methods and helper functions will be added here in the next step
  const fetchRegistryStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await DefaultService.apiDockerRegistryGet({}) as any

      if (data?.error) {
        setError(data.message)
        setIsRegistryInitialized(false)
        setRepositories([])
        return
      }

      if (data?.repositories !== undefined) {
        setRepositories(data.repositories)
        setIsRegistryInitialized(true)
        setError(null)
        return
      }

      throw new Error('Unexpected response format')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch registry status'
      setError(errorMessage)
      setIsRegistryInitialized(false)
      setRepositories([])
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchImageTags = async (repository: string) => {
    try {
      setDetailLoading(true)
      const data = await DefaultService.apiDockerRegistryGet({
        imageName: repository
      }) as any
      
      if (data?.tags) {
        setImageTags(data.tags)
        setSelectedRepository(repository)
        setViewState('image-tags')
      } else {
        toast.error('Failed to fetch image tags')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image tags'
      toast.error(errorMessage)
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchImageManifest = async (repository: string, tag: string) => {
    try {
      setDetailLoading(true)
      const manifest = await DefaultService.apiDockerRegistryGet({
        imageName: repository,
        tag: tag
      })
      
      setImageManifest(manifest as ImageManifest)
      setSelectedTag(tag)
      setViewState('image-details')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image manifest'
      toast.error(errorMessage)
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchImageConfig = async (configDigest: string) => {
    try {
      if (!imageConfig) {
        setDetailLoading(true)
        const config = await DefaultService.apiDockerRegistryGet({
          imageName: selectedRepository!,
          blob: true,
          sha256Digest: configDigest
        }) as any
        
        setImageConfig(config as ImageConfig)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image config'
      toast.error(errorMessage)
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const calculateEditorHeight = (content: string): string => {
    const lines = content.split('\n').length
    const lineHeight = 19 // Monaco editor line height
    const padding = 16 // Top and bottom padding
    const minHeight = 40
    const maxHeight = 720
    
    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, lines * lineHeight + padding))
    return `${calculatedHeight}px`
  }

  const examineLayer = async (layerDigest: string, repoName: string) => {
    if (layerContents[layerDigest]) {
      // If already loaded, just toggle visibility
      setExpandedLayers(prev => ({
        ...prev,
        [layerDigest]: !prev[layerDigest]
      }))
      return
    }

    try {
      setLayerLoading(prev => ({ ...prev, [layerDigest]: true }))
      
      // Extract SHA256 without the "sha256:" prefix
      const sha256 = layerDigest.replace('sha256:', '')
      
      const data = await DefaultService.apiDockerRegistryExamineGet({
        repo: repoName,
        sha256: sha256,
        action: 'list'
      }) as any

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to examine layer'
      toast.error(errorMessage)
    } finally {
      setLayerLoading(prev => ({ ...prev, [layerDigest]: false }))
    }
  }

  const toggleLayerContents = (layerDigest: string) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerDigest]: !prev[layerDigest]
    }))
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const buildFileTree = (files: LayerContents['contents']): TreeNode[] => {
    const tree: TreeNode[] = []
    const nodeMap = new Map<string, TreeNode>()

    // Sort files to ensure directories come before their contents
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
            if (parent && parent.children) {
              parent.children.push(node)
            }
          } else {
            tree.push(node)
          }
        }
      }
    }

    return tree
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
      
      const data = await DefaultService.apiDockerRegistryExamineGet({
        repo: repoName,
        sha256: sha256,
        action: 'file',
        filePath: filePath
      }) as any

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file'
      toast.error(errorMessage)
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
    // Remove common prefixes
    let command = createdBy
      .replace(/^\/bin\/sh -c #\(nop\)\s*/, '')
      .replace(/^\/bin\/sh -c /, 'RUN ')
      .replace(/^ADD /, 'ADD ')
      .replace(/^COPY /, 'COPY ')
      .trim()

    // Check if it's a shell command (starts with RUN and contains complex shell operations)
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
    
    // Extract the shell part after RUN
    const shellPart = command.substring(4)
    
    // Split on && and add proper indentation
    const formatted = shellPart
      .split(' && ')
      .map((part, index) => {
        if (index === 0) return `RUN ${part.trim()}`
        return `    && ${part.trim()}`
      })
      .join(' \\\n')
    
    return formatted
  }

  const navigateBack = () => {
    if (viewState === 'image-details') {
      setViewState('image-tags')
      setImageManifest(null)
      setImageConfig(null)
      setSelectedTag(null)
    } else if (viewState === 'image-tags') {
      setViewState('repositories')
      setSelectedRepository(null)
      setImageTags([])
    }
  }

  const handleCreateRegistry = () => {
    toast.info('Registry creation feature coming soon')
  }

  const handleLearnMore = () => {
    toast.info('Opening registry documentation...')
  }

  const handlePushFirstImage = () => {
    toast.info('Image push workflow coming soon')
  }

  const handleViewPushCommands = () => {
    toast.info('Showing push commands...')
  }

  // TreeView Component
  const TreeView: React.FC<{
    nodes: TreeNode[]
    layerDigest: string
    repoName: string
    depth: number
  }> = ({ nodes, layerDigest, repoName, depth }) => {
    return (
      <div>
        {nodes.map((node, index) => {
          const dirKey = `${layerDigest}:${node.path}`
          const fileKey = `${layerDigest}:${node.path}`
          const isExpanded = expandedDirectories[dirKey]
          
          return (
            <div key={index} style={{ marginLeft: `${depth * 16}px` }}>
              <div className="flex items-center py-1 hover:bg-gray-50 rounded">
                {/* Expand/Collapse Icon for Directories */}
                {node.is_dir && (
                  <button
                    className="w-4 h-4 mr-1 flex items-center justify-center text-gray-500 hover:text-gray-700"
                    onClick={() => toggleDirectory(dirKey)}
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                
                {/* File/Directory Icon and Name */}
                <div 
                  className={`flex items-center gap-1 flex-1 ${
                    node.is_file ? 'cursor-pointer hover:text-blue-600' : ''
                  }`}
                  onClick={() => {
                    if (node.is_file) {
                      viewFileContent(node.path, layerDigest, repoName)
                    } else if (node.is_dir) {
                      toggleDirectory(dirKey)
                    }
                  }}
                >
                  <span className="text-sm">
                    {node.is_dir ? '📁' : node.is_symlink ? '🔗' : '📄'}
                  </span>
                  <span className="font-mono text-xs text-gray-700">{node.name}</span>
                  {node.linkname && (
                    <span className="text-gray-500 text-xs">→ {node.linkname}</span>
                  )}
                  {fileLoading[fileKey] && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-1" />
                  )}
                </div>
                
                {/* File Size */}
                <div className="text-xs text-gray-500 min-w-16 text-right">
                  {node.is_file ? formatBytes(node.size) : ''}
                </div>
              </div>
              
              {/* Render Children for Expanded Directories */}
              {node.is_dir && isExpanded && node.children && (
                <TreeView 
                  nodes={node.children} 
                  layerDigest={layerDigest}
                  repoName={repoName}
                  depth={depth + 1}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    fetchRegistryStatus()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4 w-full">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
          <Loader2 className="w-20 h-20 mx-auto text-blue-500 animate-spin" />
          <h1 className="text-4xl font-bold text-gray-900">Loading Registry</h1>
          <p className="text-xl text-gray-600">Checking Docker registry status...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isRegistryInitialized) {
    return (
      <div title="Docker Registry">
        <div className="space-y-6">
          <RouteDescription
            title={
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Docker Registry
                  </h2>
                  <p className="text-base text-slate-500">
                    Manage your Docker images and container registry
                  </p>
                </div>
              </div>
            }
            shortDescription=""
            description="A Docker registry is a storage and distribution system for named Docker images. It allows you to push and pull container images, making it easy to share and deploy applications across different environments."
          />
          
          <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
            <CardContent className="text-center space-y-6 py-12">
              <FileText className="w-20 h-20 mx-auto text-blue-500" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Registry Not Initialized</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Get started by creating your Docker image registry. This will set up a secure container registry where you can store and manage your Docker images.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={handleCreateRegistry}>
                  Create Registry
                </Button>
                <Button onClick={handleLearnMore} variant="outline">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Empty registry state
  if (isRegistryInitialized && repositories.length === 0) {
    return (
      <div title="Docker Registry">
        <div className="space-y-6">
          <RouteDescription
            title={
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Docker Registry
                  </h2>
                  <p className="text-base text-slate-500">
                    Manage your Docker images and container registry
                  </p>
                </div>
              </div>
            }
            shortDescription=""
            description="Your Docker registry is ready! Push your first container image to get started. You can use docker push commands or integrate with your CI/CD pipeline."
          />
          
          <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
            <CardContent className="text-center space-y-6 py-12">
              <Monitor className="w-20 h-20 mx-auto text-blue-500" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Images in Registry</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your Docker registry is ready! Push your first container image to get started. You can use docker push commands or integrate with your CI/CD pipeline.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={handlePushFirstImage}>
                  Push First Image
                </Button>
                <Button onClick={handleViewPushCommands} variant="outline">
                  View Push Commands
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Image Tags View
  if (viewState === 'image-tags' && selectedRepository) {
    const tagData = imageTags.map(tag => ({
      name: tag,
      created: 'N/A',
      status: 'Available',
      rawTag: tag,
      showEdit: false,
      showDelete: false,
      showViewDetails: true
    }))

    return (
      <div title="Docker Registry - Image Tags">
        <div className="space-y-6">
          <RouteDescription
            title={
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedRepository}
                  </h2>
                  <p className="text-base text-slate-500">
                    Available image tags and versions
                  </p>
                </div>
              </div>
            }
            shortDescription=""
            description="Browse through the available tags for this repository. Each tag represents a different version or variant of the image."
          />

          <div className="flex gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={navigateBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Repositories
            </Button>
          </div>
          
          <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" />
                Available Tags ({imageTags.length})
              </CardTitle>
              <CardDescription>
                Select a tag to view detailed image information
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <ResourceTable
                  columns={tagColumns}
                  data={tagData}
                  onViewDetails={(row) => fetchImageManifest(selectedRepository, row.rawTag)}
                  className="shadow-none"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Image Details View
  if (viewState === 'image-details' && imageManifest && selectedRepository && selectedTag) {
    return (
      <div title="Docker Registry - Image Details">
        <div className="space-y-6">
          <RouteDescription
            title={
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedRepository}:{selectedTag}
                  </h2>
                  <p className="text-base text-slate-500">
                    Detailed image inspection and layer analysis
                  </p>
                </div>
              </div>
            }
            shortDescription=""
            description="Examine the structure, configuration, and build history of your Docker image. Explore individual layers and their contents to understand how your image was constructed."
          />

          <div className="flex gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={navigateBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tags
            </Button>
          </div>

          {/* Image Overview */}
          <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Image Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Media Type</div>
                  <div className="text-gray-600">{imageManifest.mediaType}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Schema Version</div>
                  <div className="text-gray-600">{imageManifest.schemaVersion}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Layers</div>
                  <div className="text-gray-600">{imageManifest.layers.length}</div>
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
                  Layers ({imageManifest.layers.length})
                  {expandedSections.layers ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </CardTitle>
              </div>
            </CardHeader>
            
            {expandedSections.layers && (
              <CardContent className="space-y-3">
                {imageManifest.layers.map((layer, index) => (
                  <div key={index} className="border rounded-lg bg-gray-50">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-gray-700">Layer {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{formatBytes(layer.size)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => examineLayer(layer.digest, selectedRepository!)}
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
                    
                    {/* Layer Contents */}
                    {layerContents[layer.digest] && expandedLayers[layer.digest] && (
                      <div className="border-t bg-white">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-800">Layer Contents</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLayerContents(layer.digest)}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Summary */}
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
                          
                          {/* File Tree */}
                          <div className="max-h-96 overflow-y-auto border rounded p-3 bg-gray-50">
                            <TreeView
                              nodes={buildFileTree(layerContents[layer.digest].contents)}
                              layerDigest={layer.digest}
                              repoName={selectedRepository!}
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
                  size="sm"
                  onClick={() => fetchImageConfig(imageManifest.config.digest)}
                  disabled={detailLoading}
                >
                  {detailLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Load Details
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Config Digest</div>
                  <div className="text-xs font-mono text-gray-600 break-all">{imageManifest.config.digest}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Config Size</div>
                  <div className="text-gray-600">{formatBytes(imageManifest.config.size)}</div>
                </div>
              </div>
              
              {imageConfig && (
                <div className="mt-6 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="font-medium text-blue-700">Architecture</div>
                      <div className="text-blue-600">{imageConfig.architecture}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="font-medium text-blue-700">OS</div>
                      <div className="text-blue-600">{imageConfig.os}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="font-medium text-blue-700">Created</div>
                      <div className="text-blue-600 text-sm">{formatDate(imageConfig.created)}</div>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  {imageConfig.config.Env && (
                    <div className="border rounded-lg">
                      <div 
                        className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSection('environment')}
                      >
                        <span className="font-medium text-gray-700">Environment Variables ({imageConfig.config.Env.length})</span>
                        {expandedSections.environment ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      {expandedSections.environment && (
                        <div className="p-3 space-y-2">
                          {imageConfig.config.Env.map((env, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded font-mono text-sm">
                              {env}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Labels */}
                  {imageConfig.config.Labels && Object.keys(imageConfig.config.Labels).length > 0 && (
                    <div className="border rounded-lg">
                      <div 
                        className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSection('labels')}
                      >
                        <span className="font-medium text-gray-700">Labels ({Object.keys(imageConfig.config.Labels).length})</span>
                        {expandedSections.labels ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      {expandedSections.labels && (
                        <div className="p-3 space-y-2">
                          {Object.entries(imageConfig.config.Labels).map(([key, value], index) => (
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
                    <div 
                      className="p-3 bg-gray-50 border-b cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSection('history')}
                    >
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
                              {/* Step Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">Step {index + 1}</span>
                                  {step.empty_layer && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Empty Layer</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{formatDate(step.created)}</div>
                              </div>
                              
                              {/* Comment */}
                              {step.comment && (
                                <div className="text-xs text-gray-500 italic mb-2">
                                  {step.comment}
                                </div>
                              )}
                              
                              {/* Command Editor */}
                              <div className="border rounded overflow-hidden">
                                <Editor
                                  height={calculateEditorHeight(displayCommand)}
                                  defaultLanguage="dockerfile"
                                  theme="vs-light"
                                  value={displayCommand}
                                  options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    lineNumbers: 'off',
                                    folding: false,
                                    lineDecorationsWidth: 0,
                                    lineNumbersMinChars: 0,
                                    glyphMargin: false,
                                    contextmenu: false,
                                    scrollbar: {
                                      vertical: 'hidden',
                                      horizontal: 'hidden'
                                    },
                                    wrappingIndent: 'indent',
                                    automaticLayout: true,
                                    padding: { top: 8, bottom: 8 },
                                    renderLineHighlight: 'none',
                                    occurrencesHighlight: 'off',
                                    cursorStyle: 'line',
                                    hideCursorInOverviewRuler: true,
                                    overviewRulerBorder: false,
                                    overviewRulerLanes: 0
                                  }}
                                />
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {fileContents[viewingFile].file_path}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      {formatBytes(fileContents[viewingFile].size)}
                    </div>
                    <Button variant="outline" size="sm" onClick={closeFileViewer}>
                      ×
                    </Button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 min-h-0 p-4">
                  {fileContents[viewingFile].is_text && fileContents[viewingFile].content ? (
                    <div className="h-full border rounded overflow-hidden">
                      <Editor
                        height="720px"
                        defaultLanguage={fileContents[viewingFile].file_path.split('.').pop() || 'text'}
                        theme="vs-light"
                        value={fileContents[viewingFile].content}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 13,
                          lineNumbers: 'on',
                          folding: true,
                          wordWrap: 'on',
                          automaticLayout: true,
                          contextmenu: false
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded border">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-700 mb-2">Binary File</h4>
                        <p className="text-gray-500 mb-4">
                          This file contains binary data and cannot be displayed as text.
                        </p>
                        {fileContents[viewingFile].download_url && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast.info('Download functionality would be implemented here')
                            }}
                          >
                            Download File
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Type: {fileContents[viewingFile].is_text ? 'Text' : 'Binary'}</span>
                    <span>SHA256: {fileContents[viewingFile].sha256.substring(0, 16)}...</span>
                  </div>
                  <Button onClick={closeFileViewer}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default repositories view
  const repositoryData = repositories.map(repo => ({
    name: repo,
    type: 'Docker Repository',
    lastModified: 'N/A',
    rawRepo: repo,
    showEdit: false,
    showDelete: false,
    showViewDetails: true
  }))

  return (
    <div title="Docker Registry">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Docker Registry
                </h2>
                <p className="text-base text-slate-500">
                  Manage your Docker images and container registry
                </p>
              </div>
            </div>
          }
          shortDescription=""
          description="Browse and manage your Docker repositories and images. View image details, inspect layers, and explore the contents of your container images."
        />
        
        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Repositories ({repositories.length})
            </CardTitle>
            <CardDescription>
              Browse available repositories in your Docker registry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ResourceTable
              columns={repositoryColumns}
              data={repositoryData}
              onViewDetails={(row) => fetchImageTags(row.rawRepo)}
              className="shadow-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Registry 