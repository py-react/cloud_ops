
import React, { useContext, useEffect, useState } from 'react'
import { PlayIcon, TrashIcon, PlusIcon, Edit2Icon, Trash2Icon, FileIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon } from 'lucide-react';
import { InfraContext } from '@/components/kubernetes/infra/context/InfraContext';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DefaultService } from '@/gingerJs_api_client';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/libs/utils';

const getFileType = (filename: string) => {
  if (filename.includes('deployment')) return 'deployment'
  if (filename.includes('service')) return 'service'
  if (filename.includes('ingress')) return 'ingress'
  if (filename.includes('config')) return 'config'
  return 'other'
}

const getFileColor = (type: string) => {
  switch (type) {
    case 'deployment':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'service':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'ingress':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'config':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function InfraManager() {
  const [isOpen,setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [mode,setMode] = useState("create")
  const [fileName, setFileName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [deleteFile,setDeleteFile] = useState(null)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  const {
    selectedCategory,
    selectedSubcategory,
    resources,
    setResources
  } = useContext(InfraContext);

  // Group files by project path
  const groupedFiles = React.useMemo(() => {
    const groups = {}
    resources.forEach(file => {
      const pathParts = file.path.split('/')
      const projectPath = pathParts.slice(0, -1).join('/')
      if (!groups[projectPath]) {
        groups[projectPath] = []
      }
      groups[projectPath].push(file)
    })
    return Object.entries(groups).map(([path, files]) => ({ path, files }))
  }, [resources])

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const closeModal=()=>{
    setIsOpen(false)
    setFileName("")
    setProjectName("")
    setContent("")
    setMode("create")
  }

  const getFiles = async()=>{
    const files = await DefaultService.apiInfraGet({
        category:selectedCategory,
        subCategory:selectedSubcategory,
    })
    if(files.files){
        setResources(files.files)
        toast.info("Fetched resources")
    }else{
        toast.error("Failed to fetch resources")
    }
}

  useEffect(()=>{
    if(selectedSubcategory && selectedCategory){
      getFiles()
    }
},[selectedSubcategory,selectedCategory])

const handleDelete=async()=>{
  if(deleteFile){
    const splitPath = deleteFile.path.split("/")
    const fileName = splitPath.pop()
    const project = splitPath.pop()
    const deleted = await DefaultService.apiInfraDelete({
      category:selectedCategory,
      subCategory:selectedSubcategory,
      project:project,
      fileName:fileName
    })
    if(deleted.deleted){
      toast.success("File Deleted")
      getFiles()
    }else{
      toast.error("An Error occured while performing the action")
    }
  }
}

  return (
    <div className="w-full border-r border-gray-200">
      <Dialog open={isOpen} onOpenChange={closeModal}>
        {selectedCategory && selectedSubcategory ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{selectedSubcategory}</h3>
                <button
                  type="button"
                  onClick={()=>{
                    setIsOpen(true)
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  title="Add new resource"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
            </div>
            <div className="space-y-2">
            {groupedFiles.map((group) => (
          <div key={group.path} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 text-left"
              onClick={() => toggleGroup(group.path)}
            >
              {expandedGroups.has(group.path) ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <FolderIcon className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{group.path.split("/")[2]}</span>
              <span className="text-gray-500 text-sm ml-2">({group.files.length} files)</span>
            </button>
            
            {expandedGroups.has(group.path) && (
              <div className="divide-y">
                {group.files.map((file) => {
                  const fileName = file.path.split('/').pop() || ''
                  const fileType = getFileType(fileName)
                  const colorClass = getFileColor(fileType)
                  
                  return (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{fileName}</div>
                          <div className="text-sm text-gray-500 truncate">{file.path}</div>
                        </div>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', colorClass)}>
                          {fileType}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setMode("edit")
                            setIsOpen(true)
                            const splitPath = file.path.split("/")
                            const fileName = splitPath.pop()
                            const project = splitPath.pop()
                            setProjectName(project)
                            setFileName(fileName)
                            setContent(file.content)
                          }}
                        >
                          <Edit2Icon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteFile(file)}
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
            {/* {resources.map((file) => {
              const splitPath = file.path.split("/")
              const category = splitPath[0]
              const subCategory = splitPath[1]
              if(category !== selectedCategory && subCategory !== selectedSubcategory) return
              return (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div>
                    <h3 className="font-medium">{file.path.split('/').pop()}</h3>
                    <p className="text-sm text-muted-foreground">{file.path}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMode("edit")
                        setIsOpen(true)
                        const splitPath = file.path.split("/")
                        const fileName = splitPath.pop()
                        const project = splitPath.pop()
                        setProjectName(project)
                        setFileName(fileName)
                        setContent(file.content)
                      }}
                    >
                      <Edit2Icon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteFile(file)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })} */}
            </div>
          </div>
        ) : (
          <div className="p-4 text-gray-500 text-sm">
            Select a category and subcategory to view resources
          </div>
        )}
        <DialogContent className="max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create New YAML File' : 'Edit YAML File'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {mode === 'create' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="flow"
                  />
                </div>
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="deployment.yaml"
                  />
                </div>
              </div>
            )}
            <div className="h-[400px] border rounded-md">
              <Editor
                height="400px"
                defaultLanguage="yaml"
                value={content}
                onChange={(value) => setContent(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={async()=>{
              if(mode==="edit"){
                const edited = await DefaultService.apiInfraPut({requestBody:{
                  category:selectedCategory,
                  sub_category:selectedSubcategory,
                  file_name:fileName,
                  project:projectName,
                  content:content
                }})
                if(edited.edited){
                  toast.info(`Created file: ${fileName} under Category: ${selectedCategory}, Sub category: ${selectedSubcategory}, Project: ${projectName}`)
                  closeModal()
                  getFiles()
                }else{
                  toast.error(`Unable to create`)
  
                }
                return
              }
              const createfile = await DefaultService.apiInfraPost({requestBody:{
                category:selectedCategory,
                sub_category:selectedSubcategory,
                file_name:fileName,
                project:projectName,
                content:content
              }})
              if(createfile.created){
                toast.info(`Created file: ${fileName} under Category: ${selectedCategory}, Sub category: ${selectedSubcategory}, Project: ${projectName}`)
                closeModal()
                getFiles()

              }else{
                toast.error(`Unable to create`)

              }

            }} disabled={!content || (mode === 'create' && (!selectedCategory || !selectedSubcategory || !fileName))}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the YAML file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default InfraManager