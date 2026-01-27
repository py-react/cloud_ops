import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Monitor, Loader2, ArrowLeft, Eye, Package, Clock, Tag, Layers, Settings, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'
import RouteDescription from '@/components/route-description'
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import useNavigate from '@/libs/navigate'



// Define columns for ResourceTable
const repositoryColumns = [
  { header: 'Repository Name', accessor: 'name' },
  { header: 'Type', accessor: 'type' },
]

const Registry = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repositories, setRepositories] = useState<string[]>([])
  const [isRegistryInitialized, setIsRegistryInitialized] = useState(false)

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
              onViewDetails={(row) => navigate(`/cee/docker/registry/${row.rawRepo}`)}
              className="shadow-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Registry 