import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Monitor, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

const Registry = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repositories, setRepositories] = useState<string[]>([])
  const [isRegistryInitialized, setIsRegistryInitialized] = useState(false)

  const fetchRegistryStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/docker/registry', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if response is an error (registry not initialized)
      if (data.error) {
        setError(data.message)
        setIsRegistryInitialized(false)
        setRepositories([])
        return
      }

      // Success response with repositories
      if (data.repositories !== undefined) {
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
  if (isRegistryInitialized && repositories.length === 0) {
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
                    <Button variant="outline" size="sm">
                      View Details
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