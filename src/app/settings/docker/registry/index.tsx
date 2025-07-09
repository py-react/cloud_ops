import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Monitor, Loader2, ArrowLeft, Eye, Package, Clock, Tag, Layers, Settings, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'
import { Editor } from "@monaco-editor/react"

interface RegistryResponse {
  repositories: string[]
}

interface RegistryError {
  error: boolean
  message: string
  status?: string
  details?: string
  namespace?: string
  service?: string
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

interface ImageTag {
  name: string
  tags: string[]
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

// View states
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

  const fetchRegistryStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await DefaultService.apiDockerRegistryGet({}) as any

      // Check if response is an error (registry not initialized)
      if (data?.error) {
        setError(data.message)
        setIsRegistryInitialized(false)
        setRepositories([])
        return
      }

      // Success response with repositories
      if (data?.repositories !== undefined) {
        setRepositories(data.repositories)
        setIsRegistryInitialized(true)
        setError(null)
        return
      }

      // Fallback for unexpected response format
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

  const formatFileMode = (mode: string) => {
    // Convert octal mode to readable format
    return mode
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

  useEffect(() => {
    fetchRegistryStatus()
  }, [])

  const handleCreateRegistry = () => {
    // TODO: Implement registry creation logic
    toast.info('Registry creation feature coming soon')
  }

  const handleLearnMore = () => {
    // TODO: Implement navigation to documentation
    toast.info('Opening registry documentation...')
  }

  const handlePushFirstImage = () => {
    // TODO: Implement image push workflow
    toast.info('Image push workflow coming soon')
  }

  const handleViewPushCommands = () => {
    // TODO: Implement push commands modal
    toast.info('Showing push commands...')
  }

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

  // Registry not initialized state (error response)
  if (error && !isRegistryInitialized) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4 w-full">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
          <FileText className="w-20 h-20 mx-auto text-blue-500" />
          <h1 className="text-4xl font-bold text-gray-900">Docker Registry Not Initialized</h1>
          <p className="text-xl text-gray-600">
            Get started by creating your Docker image registry. This will set up a secure container registry where you can store and manage your Docker images.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleCreateRegistry}
              className="px-8"
            >
              Create Registry
            </Button>
            <Button 
              onClick={handleLearnMore}
              variant="outline"
              className="px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Registry initialized but no images state (empty repositories)
  if (isRegistryInitialized && repositories.length === 0 && viewState === 'repositories') {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4 w-full">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
          <Monitor className="w-20 h-20 mx-auto text-blue-500" />
          <h1 className="text-4xl font-bold text-gray-900">No Images in Registry</h1>
          <p className="text-xl text-gray-600">
            Your Docker registry is ready! Push your first container image to get started. You can use docker push commands or integrate with your CI/CD pipeline.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handlePushFirstImage}
              className="px-8"
            >
              Push First Image
            </Button>
            <Button 
              onClick={handleViewPushCommands}
              variant="outline"
              className="px-8"
            >
              View Push Commands
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Image Details View
  if (viewState === 'image-details' && imageManifest && selectedRepository && selectedTag) {
    return (
      <div className="p-6 w-full">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={navigateBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tags
              </Button>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">{selectedRepository}:{selectedTag}</span>
              </div>
            </div>
            
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
          </div>

          {/* Layers Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div 
              className="p-4 border-b cursor-pointer flex items-center justify-between"
              onClick={() => toggleSection('layers')}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800">Layers ({imageManifest.layers.length})</h2>
              </div>
              {expandedSections.layers ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
            
            {expandedSections.layers && (
              <div className="p-4 space-y-3">
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
              </div>
            )}
          </div>

          {/* Config Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
                </div>
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
            </div>
            
            <div className="p-4 space-y-3">
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
                              <div className="border rounded overflow-hidden p-4">
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
            </div>
          </div>

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
                    <div className="h-full border  rounded overflow-hidden">
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
                              // In a real app, you'd handle the download here
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

  // Image Tags View
  if (viewState === 'image-tags' && selectedRepository) {
    return (
      <div className="p-6 w-full">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={navigateBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Repositories
              </Button>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-900">{selectedRepository}</h1>
              </div>
            </div>
            
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Available Tags ({imageTags.length})</h2>
                <div className="grid gap-4">
                  {imageTags.map((tag, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900">{tag}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchImageManifest(selectedRepository, tag)}
                          disabled={detailLoading}
                        >
                          {detailLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 mr-2" />
                          )}
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Registry has images state (show repositories)
  return (
    <div className="p-6 w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Docker Registry</h1>
          <p className="text-gray-600 mb-6">
            Manage your Docker images and repositories. Found {repositories.length} repositories.
          </p>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Repositories</h2>
            <div className="grid gap-4">
              {repositories.map((repo, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">{repo}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchImageTags(repo)}
                      disabled={detailLoading}
                    >
                      {detailLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      View Tags
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Registry