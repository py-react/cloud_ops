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
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-700">Layer {index + 1}</span>
                      <span className="text-sm text-gray-600">{formatBytes(layer.size)}</span>
                    </div>
                    <div className="text-xs font-mono text-gray-500 break-all">{layer.digest}</div>
                    <div className="text-xs text-gray-500 mt-1">{layer.mediaType}</div>
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