import { ResourceTable } from '@/components/kubernetes/resources/resourceTable'
import RouteDescription from '@/components/route-description'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DefaultService } from '@/gingerJs_api_client'
import useNavigate from '@/libs/navigate'
import { Loader2, Package, Tag } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'

const tagColumns = [
  { header: 'Tag Name', accessor: 'name' },
  { header: "Architecture", accessor: "config.architecture" },
  { header: "OS", accessor: "config.os" },
  { header: "Created", accessor: "created" },
  { header: "Labels", accessor: "labels" },
]

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

const RegistryImage = () => {
  const { image } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const registryId = queryParams.get('registry_id')
  const registryName = queryParams.get('registry_name')

  const [tags, setTags] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

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
      // Use fetchImageManifest and Promise.all to get all manifests for the tags
      if (Array.isArray((res as any).tags)) {
        const tagsArray = (res as any).tags as string[];
        // For each tag, fetch manifest, then fetch config using manifest.config.digest
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
        console.log(tagData)
        setTags(tagData);
      }
    } else {
      toast.error(res.message)
    }
    setDetailLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [image])



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
                  {image}
                </h2>
                <p className="text-base text-slate-500">
                  Available tags for {image} in {registryName || 'Registry'}
                </p>
              </div>
            </div>
          }
          shortDescription=""
          description="Browse through the available tags for this repository. Each tag represents a different version or variant of the image."
        />

        <Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" />
              Available Tags ({tags.length})
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
                data={
                  [...tags]
                    .sort((a, b) => {
                      const aCreated = a?.config?.created ? Date.parse(a.config.created) : 0;
                      const bCreated = b?.config?.created ? Date.parse(b.config.created) : 0;
                      // Descending: newest first
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
                onViewDetails={(row) => {
                  const url = `/settings/docker/registry/${image}/${row.rawTag}?registry_id=${registryId || ''}&registry_name=${registryName || ''}`
                  navigate(url)
                }}
                className="shadow-none"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegistryImage