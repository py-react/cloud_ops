import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, Loader2, Package, Plus, ArrowLeft, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { DefaultService } from '@/gingerJs_api_client'
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import useNavigate from '@/libs/navigate'
import PageLayout from '@/components/PageLayout'
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import { RegistryForm } from "@/components/docker/registry/forms/RegistryForm"
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
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { Input } from "@/components/ui/input"

const registrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["remote", "k8s"]),
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  namespace: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'remote' && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "URL is required for remote registry",
      path: ["url"]
    });
  }
  if (data.type === 'k8s' && !data.namespace) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Namespace is required for K8s registry",
      path: ["namespace"]
    });
  }
});

const defaultValues = {
  name: '',
  type: 'remote' as const,
  url: '',
  username: '',
  password: '',
  namespace: 'image-registry',
}

// Define columns for Repository Table
const repositoryColumns = [
  { header: 'Repository Name', accessor: 'name' },
  { header: 'Type', accessor: 'type' },
]

const Registry = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Registry List State
  const [registries, setRegistries] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Registry State (for viewing details)
  const [selectedRegistry, setSelectedRegistry] = useState<any | null>(null)
  const [repositories, setRepositories] = useState<string[]>([])
  const [repoLoading, setRepoLoading] = useState(false)
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingRegistry, setEditingRegistry] = useState<any | null>(null)

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [registryToDelete, setRegistryToDelete] = useState<any | null>(null)

  // Wizard Form Data
  const [initialValues, setInitialValues] = useState<any>(defaultValues);

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
      // Use native fetch to ensure registry_id is sent correctly
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
    setInitialValues(defaultValues)
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
    setInitialValues({
      name: reg.name || '',
      type: reg.is_remote ? 'remote' : 'k8s',
      url: reg.url || '',
      username: reg.username || '',
      password: '', // Don't pre-fill password
      namespace: config.namespace || 'image-registry',
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

  const handleSubmit = async (values: any) => {
    try {
      if (editingRegistry) {
        // Update Logic
        const payload = {
          registry_id: editingRegistry.id,
          name: values.name,
          url: values.url,
          username: values.username,
          password: values.password
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
        type: values.type,
        name: values.name,
        ...(values.type === 'remote' ? {
          url: values.url,
          username: values.username,
          password: values.password
        } : {
          namespace: values.namespace,
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
    setSelectedRegistry(reg)
  }

  const handleBackToList = () => {
    setSelectedRegistry(null)
    setRepositories([])
    setRepoSearchQuery("")
  }

  // --- Wizard Steps ---

  const steps = useMemo(() => [
    {
      id: 'configuration',
      label: 'Registry Details',
      description: 'Configure registry connection',
      longDescription: 'Configure your Docker registry connection details. Choose between a remote registry (like Docker Hub) or a Kubernetes-hosted registry.',
      component: (props: any) => <RegistryForm {...props} isEditing={!!editingRegistry} />,
    },
  ], [editingRegistry]);


  // --- Table Data Filtering ---
  const filteredRegistries = useMemo(() => {
    return registries.filter(reg =>
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.url && reg.url.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [registries, searchQuery]);

  // View: Details (Single Registry Repositories)
  if (selectedRegistry) {
    const filteredRepos = repositories
      .filter(repo => repo.toLowerCase().includes(repoSearchQuery.toLowerCase()))
      .map(repo => ({
        name: repo,
        type: 'Docker Repository',
        lastModified: 'N/A',
        rawRepo: repo,
        showEdit: false,
        showDelete: false,
        showViewDetails: true
      }));

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
          <div className="flex-none grid grid-cols-1 md:grid-cols-4 gap-2 px-0">
            <ResourceCard
              title="Total Repositories"
              count={repositories.length}
              icon={<Package className="w-4 h-4" />}
              color="bg-blue-500"
              className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
              isLoading={repoLoading}
            />
          </div>

          {repoLoading && !repositories.length ? (
            <div className="h-[400px] flex items-center justify-center p-4 w-full">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : repositories.length === 0 && !repoLoading ? (
            <Card className="p-12 text-center">
              <Monitor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
              <p className="text-muted-foreground mb-6">This registry is empty or not reachable.</p>
              <Button variant="outline" onClick={() => fetchRepositories(selectedRegistry.id)}>Retry Connection</Button>
            </Card>
          ) : (
            <div className="flex-1 min-h-0">
              <ResourceTable
                className="pt-0 shadow-none border-0"
                loading={repoLoading}
                title="Repositories"
                description={`Images stored in ${selectedRegistry.name}`}
                icon={<Layers className="h-5 w-5" />}
                columns={repositoryColumns}
                data={filteredRepos}
                extraHeaderContent={
                  <Input
                    placeholder="Search repositories..."
                    value={repoSearchQuery}
                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                    className="h-9 w-64"
                  />
                }
                onViewDetails={(row) => navigate(`/cee/docker/registry/${row.rawRepo}`)}
              />
            </div>
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
  const registryTableData = filteredRegistries.map(reg => ({
    ...reg,
    type_label: reg.is_remote ? 'Remote' : 'Kubernetes',
    status_label: 'Active',
    showViewDetails: true,
    showEdit: reg.is_remote,
    showDelete: true
  }))

  const activeTab = "configuration"

  return (
    <>
      <PageLayout
        title="Image Registries"
        subtitle="Manage your connected image registries"
        icon={Package}
        actions={
          <Button variant="gradient" onClick={handleCreateRegistryLaunch}>
            <Plus className="w-4 h-4 mr-2" />
            Add Registry
          </Button>
        }
      >
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
          <ResourceCard
            title="Total Registries"
            count={registries.length}
            icon={<Package className="w-4 h-4" />}
            color="bg-purple-500"
            className="border-purple-500/20 bg-purple-500/5 shadow-none hover:border-purple-500/30 transition-all"
            isLoading={loading}
          />
        </div>

        <div className="flex-1 min-h-0 mt-6">
          <ResourceTable
            className="pt-0 shadow-none border-0"
            loading={loading}
            title="Configured Registries"
            description="List of all connected registry endpoints."
            icon={<Layers className="h-5 w-5" />}
            columns={registryColumns}
            data={registryTableData}
            extraHeaderContent={
              <Input
                placeholder="Search connection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64"
              />
            }
            onViewDetails={(row) => handleSelectRegistry(row)}
            onEdit={(row) => handleEditRegistry(row)}
            onDelete={(row) => handleDeleteRequest(row)}
          />
        </div>
      </PageLayout>

      <FormWizard
        name="registry-wizard"
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        currentStep={activeTab}
        setCurrentStep={() => { }}
        steps={steps}
        schema={registrySchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={editingRegistry ? "Update Registry" : "Create Registry"}
        submitIcon={Package}
        heading={{
          primary: editingRegistry ? "Edit Registry" : "Add Registry",
          secondary: editingRegistry ? "Update registry details" : "Configure a new Docker registry connection",
          icon: Package,
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the registry configuration
              {registryToDelete?.is_remote === false && " and remove associated Kubernetes resources (Deployment, Service, PVC)."}
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