import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Monitor, Loader2, Package, Plus, Server, Cloud, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import useNavigate from '@/libs/navigate'
import PageLayout from '@/components/PageLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormWizard, Step } from '@/components/FormWizard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define columns for ResourceTable
const repositoryColumns = [
  { header: 'Repository Name', accessor: 'name' },
  { header: 'Type', accessor: 'type' },
]

const Registry = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Registry List State
  const [registries, setRegistries] = useState<any[]>([])

  // Selected Registry State (for viewing details)
  const [selectedRegistry, setSelectedRegistry] = useState<any | null>(null)
  const [repositories, setRepositories] = useState<string[]>([])
  const [repoLoading, setRepoLoading] = useState(false)

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardType, setWizardType] = useState<'remote' | 'k8s' | null>(null)
  const [editingRegistry, setEditingRegistry] = useState<any | null>(null)

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [registryToDelete, setRegistryToDelete] = useState<any | null>(null)

  // Wizard Form Data
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    namespace: 'image-registry',
    storageClass: 'standard',
    serviceType: 'ClusterIP'
  })

  // --- Data Fetching ---

  const fetchRegistries = async () => {
    try {
      setLoading(true)
      // Use native fetch to ensure query params are sent correctly
      const res = await fetch('/api/docker/registry?mode=list')
      const data = await res.json()

      if (data?.registries) {
        setRegistries(data.registries)
      } else {
        setRegistries([])
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load registries")
    } finally {
      setLoading(false)
    }
  }

  const fetchRepositories = async (registryId: number) => {
    try {
      setRepoLoading(true)
      // Use native fetch to ensure registry_id is sent correctly (Client might be outdated)
      const res = await fetch(`/api/docker/registry?registry_id=${registryId}`)
      const data = await res.json()

      if (data?.repositories) {
        setRepositories(data.repositories)
      } else {
        setRepositories([])
        if (data?.error) toast.error(data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch repositories')
    } finally {
      setRepoLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistries()
  }, [])

  useEffect(() => {
    if (selectedRegistry) {
      fetchRepositories(selectedRegistry.id)
    }
  }, [selectedRegistry])

  // --- Handlers ---

  const handleCreateRegistryLaunch = () => {
    setEditingRegistry(null)
    setFormData({
      name: '',
      url: '',
      username: '',
      password: '',
      namespace: 'image-registry',
      storageClass: 'standard',
      serviceType: 'ClusterIP'
    })
    setWizardType(null)
    setIsWizardOpen(true)
  }

  const handleEditRegistry = (reg: any) => {
    let config: any = {};
    try {
      if (typeof reg.config_json === 'string') {
        config = JSON.parse(reg.config_json);
      } else if (typeof reg.config_json === 'object') {
        config = reg.config_json || {};
      }
    } catch (e) {
      console.error("Failed to parse config", e);
    }

    setEditingRegistry(reg)
    setWizardType(reg.is_remote ? 'remote' : 'k8s')
    setFormData({
      name: reg.name || '',
      url: reg.url || '',
      username: reg.username || '',
      password: '', // Don't pre-fill password for security
      namespace: config.namespace || 'image-registry',
      storageClass: 'standard',
      serviceType: 'ClusterIP'
    })
    setIsWizardOpen(true)
  }

  const handleDeleteRequest = (reg: any) => {
    setRegistryToDelete(reg)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!registryToDelete) return

    try {
      const res = await fetch('/api/docker/registry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registry_id: registryToDelete.id })
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Registry removed")
        fetchRegistries()
      } else {
        toast.error(data.message || "Failed to remove registry")
      }
    } catch (e) {
      toast.error("Error removing registry")
      console.error(e)
    } finally {
      setDeleteDialogOpen(false)
      setRegistryToDelete(null)
    }
  }

  const handleCreateSubmit = async () => {
    try {
      if (editingRegistry) {
        // Update Logic
        const payload = {
          registry_id: editingRegistry.id,
          name: formData.name, // Name usually immutable but API might allow?
          url: formData.url,
          username: formData.username,
          password: formData.password
        }
        const res = await fetch('/api/docker/registry', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Registry updated')
          setIsWizardOpen(false)
          fetchRegistries()
        } else {
          toast.error(data.message || 'Update failed')
        }
        return
      }

      // Create Logic
      const payload = {
        action: 'create_registry' as const,
        type: wizardType,
        name: formData.name,
        ...(wizardType === 'remote' ? {
          url: formData.url,
          username: formData.username,
          password: formData.password
        } : {
          namespace: formData.namespace,
        })
      }

      const res = await DefaultService.apiDockerRegistryPost({ requestBody: payload as any }) as any

      if (res?.success) {
        toast.success('Registry created successfully')
        setIsWizardOpen(false)
        fetchRegistries()
      } else {
        toast.error(res?.message || 'Failed to create registry')
      }
    } catch (err) {
      toast.error('An error occurred during creation')
    }
  }

  const handleSelectRegistry = (reg: any) => {
    // Current "View Details" -> Go to Repositories
    setSelectedRegistry(reg)
  }

  const handleBackToList = () => {
    setSelectedRegistry(null)
    setRepositories([])
  }

  // --- Wizard Steps ---

  const steps: Step[] = [
    {
      id: 'configuration',
      title: 'Registry Details',
      description: 'Configure your registry connection',
      content: (
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Registry Type</Label>
            <Select
              value={wizardType || ''}
              onValueChange={(val: 'remote' | 'k8s') => setWizardType(val)}
              disabled={!!editingRegistry} // Type is immutable when editing
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote Registry (Docker Hub, Harbor, etc.)</SelectItem>
                <SelectItem value="k8s">Kubernetes Hosted (Deploy New)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Registry Name</Label>
            <Input
              placeholder="my-registry"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!!editingRegistry}
            />
            <p className="text-xs text-muted-foreground">Unique identifier for this registry.</p>
          </div>

          {wizardType === 'remote' && (
            <>
              <div className="space-y-2">
                <Label>Registry URL</Label>
                <Input
                  placeholder="registry.example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username (Optional)</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password / Token (Optional)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingRegistry ? "(Unchanged)" : ""}
                  />
                </div>
              </div>
            </>
          )}

          {wizardType === 'k8s' && (
            <>
              <div className="space-y-2">
                <Label>Namespace</Label>
                <Input
                  value={formData.namespace}
                  onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                  disabled={!!editingRegistry}
                />
                <p className="text-xs text-muted-foreground">Target namespace for deployment.</p>
              </div>
            </>
          )}
        </div>
      ),
      validation: () => !!wizardType && !!formData.name && (wizardType === 'k8s' || !!formData.url)
    }
  ]


  // --- Views ---

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  // View: Details (Single Registry Repositories)
  if (selectedRegistry) {
    const repositoryData = repositories.map(repo => ({
      name: repo,
      type: 'Docker Repository',
      lastModified: 'N/A',
      rawRepo: repo,
      showEdit: false,
      showDelete: false,
      showViewDetails: true // Opens repo details
    }))

    return (
      <PageLayout
        title={selectedRegistry.name}
        subtitle={selectedRegistry.is_remote ? `Remote: ${selectedRegistry.url}` : `K8s: ${selectedRegistry.url}`}
        icon={Package}
        actions={
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registries
          </Button>
        }
      >
        <div className="space-y-6">
          {repoLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : repositories.length === 0 ? (
            <Card className="p-12 text-center">
              <Monitor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
              <p className="text-muted-foreground mb-6">This registry is empty or not reachable.</p>
              <Button variant="outline">Check Connection</Button>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Repositories ({repositories.length})</CardTitle>
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
          )}
        </div>
      </PageLayout>
    )
  }

  // Columns for Registry List
  const registryColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'URL', accessor: 'url' },
    { header: 'Type', accessor: 'type_label' },
    { header: 'Status', accessor: 'status_label' },
  ]

  // Map Data
  const registryTableData = registries.map(reg => ({
    ...reg,
    type_label: reg.is_remote ? 'Remote' : 'Kubernetes',
    status_label: 'Active',
    showViewDetails: true, // Used for Edit/Config View
    showEdit: reg.is_remote, // Only allow editing for Remote registries
    showDelete: true
  }))

  return (
    <>
      <PageLayout
        title="Image Registries"
        subtitle="Manage your connected image registries"
        icon={Package}
        actions={
          <Button onClick={handleCreateRegistryLaunch}>
            <Plus className="w-4 h-4 mr-2" />
            Add Registry
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Configured Registries</CardTitle>
            <CardDescription>List of all connected registry endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ResourceTable
              columns={registryColumns}
              data={registryTableData}
              onViewDetails={(row) => handleSelectRegistry(row)} // Click row -> View Repositories
              onEdit={(row) => handleEditRegistry(row)} // Edit Action -> Open Form Wizard
              onDelete={(row) => handleDeleteRequest(row)} // Delete Action -> Confirm Dialog
              className="shadow-none border-0"
            />
          </CardContent>
        </Card>
      </PageLayout>

      {isWizardOpen && (
        <FormWizard
          title={editingRegistry ? "Edit Registry" : "Add Registry"}
          description={editingRegistry ? "Update registry details" : "Configure a new Docker registry connection"}
          steps={steps}
          onComplete={handleCreateSubmit}
          onCancel={() => setIsWizardOpen(false)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the registry configuration
              {registryToDelete?.type_label === 'Kubernetes' && " and remove associated Kubernetes resources (Deployment, Service, PVC)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Registry