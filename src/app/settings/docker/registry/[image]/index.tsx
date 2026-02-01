import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import { DefaultService } from '@/gingerJs_api_client'
import useNavigate from '@/libs/navigate'
import { Loader2, Package, RefreshCw, Tag, Layers, Settings, Eye, FileText, Info } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageLayout from '@/components/PageLayout'
import ResourceCard from '@/components/kubernetes/dashboard/resourceCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/utils'
import FormWizard from '@/components/wizard/form-wizard'
import * as z from 'zod'

const tagColumns = [
  { header: 'Tag Name', accessor: 'name' },
  { header: "Architecture", accessor: "config.architecture" },
  { header: "OS", accessor: "config.os" },
  { header: "Created", accessor: "created" },
  { header: "Labels", accessor: "labels", type: 'labels' },
]

const tagSchema = z.object({
  name: z.string(),
  architecture: z.string(),
  os: z.string(),
  created: z.string(),
  mediaType: z.string(),
  layers: z.array(z.any()),
});

const fetchImageManifest = async (image: string, tag: string, registryId?: string) => {
  try {
    const manifest = await DefaultService.apiDockerRegistryGet({
      imageName: image,
      tag: tag,
      registryId: registryId ? parseInt(registryId) : undefined
    })
    return manifest
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image manifest'
    return errorMessage
  }
}

const fetchImageConfig = async (image: string, configDigest: string, registryId?: string) => {
  try {
    const config = await DefaultService.apiDockerRegistryGet({
      imageName: image,
      blob: true,
      sha256Digest: configDigest,
      registryId: registryId ? parseInt(registryId) : undefined
    }) as any

    return config
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image config'
    return errorMessage
  }
}

const TagSummary = ({ watch }: any) => {
  const values = watch();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Architecture</div>
          <div className="text-sm font-bold">{values.architecture}</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">OS</div>
          <div className="text-sm font-bold">{values.os}</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Created</div>
          <div className="text-sm font-bold">{values.created}</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Media Type</div>
          <div className="text-sm font-bold break-all text-[11px] font-mono">{values.mediaType}</div>
        </div>
      </div>
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Digest</div>
        <div className="text-[10px] font-mono break-all">{values.digest}</div>
      </div>
    </div>
  )
}

const LayerList = ({ watch }: any) => {
  const fetchSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const layers = watch('layers') || [];
  return (
    <div className="space-y-2">
      {layers.map((layer: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 border border-border/10 rounded-lg text-[11px]">
          <div className="font-mono text-muted-foreground truncate mr-4">
            {layer.digest}
          </div>
          <div className="font-bold shrink-0">
            {fetchSize(layer.size)}
          </div>
        </div>
      ))}
    </div>
  )
}

const RegistryImage = () => {
  const { image } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const registryId = queryParams.get('registry_id')
  const registryName = queryParams.get('registry_name')

  const [tags, setTags] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Wizard States
  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState('summary')
  const [selectedTag, setSelectedTag] = useState<any>(null)

  const fetchTags = async () => {
    setDetailLoading(true)
    const params: any = { "imageName": image };
    if (registryId) {
      params.registryId = parseInt(registryId);
    }

    const res = await DefaultService.apiDockerRegistryGet(params).catch(err => {
      toast.error("Failed to fetch tags")
      return null
    }) as any
    if (res && res.tags) {
      if (Array.isArray((res as any).tags)) {
        const tagsArray = (res as any).tags as string[];
        const allPromises = tagsArray.map(async tag => {
          const manifest = await fetchImageManifest(image as string, tag, registryId as string) as any;
          let config = null;
          if (manifest && typeof manifest === 'object' && manifest.config && manifest.config.digest) {
            config = await fetchImageConfig(image as string, manifest.config.digest, registryId as string);
          }
          return {
            tag,
            manifest,
            config
          };
        });
        const tagResults = await Promise.all(allPromises);

        const tagData = tagResults.map(({ tag, manifest, config }) => ({
          name: tag,
          rawTag: tag,
          showViewDetails: true,
          manifest,
          config
        }));
        setTags(tagData);
      }
    } else {
      toast.error(res?.message || "Failed to fetch tags")
    }
    setDetailLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [image])

  const handleViewDetails = (row: any) => {
    setSelectedTag({
      name: row.name,
      architecture: row.config?.architecture || 'unknown',
      os: row.config?.os || 'unknown',
      created: row.config?.created ? new Date(row.config.created).toLocaleString() : 'unknown',
      mediaType: row.manifest?.mediaType || 'unknown',
      digest: row.manifest?.config?.digest || 'unknown',
      layers: row.manifest?.layers || [],
      rawTag: row.rawTag
    })
    setWizardOpen(true)
  }

  const tagSteps = useMemo(() => [
    {
      id: 'summary',
      label: 'Image Summary',
      description: 'Core metadata',
      longDescription: 'View the basic information about this image tag, including architecture, OS, and creation date.',
      component: TagSummary,
      icon: Info
    },
    {
      id: 'layers',
      label: 'Layers Overview',
      description: 'Image construction',
      longDescription: 'A list of all layers that make up this Docker image and their respective sizes.',
      component: LayerList,
      icon: Layers
    }
  ], [])

  return (
    <PageLayout
      title={image || "Image Tags"}
      subtitle={
        <>
          Available tags for <span className="text-primary font-bold">{image}</span> in <span className="text-primary font-bold">{registryName || 'Registry'}</span>
        </>
      }
      icon={Package}
      actions={
        <div className="flex items-center gap-2 mb-1">
          <Button variant="outline" onClick={fetchTags} disabled={detailLoading}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", detailLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <ResourceCard
          title="Total Tags"
          count={tags.length}
          icon={<Tag className="w-4 h-4" />}
          color="bg-blue-500"
          className="border-blue-500/20 bg-blue-500/5 shadow-none hover:border-blue-500/30 transition-all"
          isLoading={detailLoading}
        />
      </div>

      <ResourceTable
        columns={tagColumns}
        loading={detailLoading}
        data={
          [...tags]
            .sort((a, b) => {
              const aCreated = a?.config?.created ? Date.parse(a.config.created) : 0;
              const bCreated = b?.config?.created ? Date.parse(b.config.created) : 0;
              return bCreated - aCreated;
            })
            .map(tag => ({
              ...tag,
              created: tag?.config?.created
                ? new Date(Date.parse(tag.config.created)).toLocaleString()
                : "",
              labels: tag?.config?.config?.Labels
                ? Object.entries(tag.config.config.Labels || {}).map(([k, v]) => `${k.replace("com.github.", "")}=${v}`)
                : []
            }))
        }
        onViewDetails={handleViewDetails}
        className="shadow-none p-0 py-0"
      />

      <FormWizard
        name="tag-details-wizard"
        isWizardOpen={wizardOpen}
        setIsWizardOpen={setWizardOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={tagSteps}
        schema={tagSchema}
        initialValues={selectedTag || {}}
        onSubmit={() => { }}
        submitLabel="Close"
        heading={{
          primary: `Inspect Tag: ${selectedTag?.name}`,
          secondary: `Detailed information for ${image}:${selectedTag?.name}`,
          icon: Eye,
          actions: (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                const url = `/settings/docker/registry/${image}/${selectedTag.rawTag}?registry_id=${registryId || ''}&registry_name=${registryName || ''}`
                navigate(url)
              }}
            >
              Full Details
              <Package className="w-3.5 h-3.5 ml-2" />
            </Button>
          )
        }}
        hideActions={true}
      />
    </PageLayout>
  )
}

export default RegistryImage