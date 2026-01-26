import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-shadcn";
import {
  Container,
  Database,
  Cpu,
  Activity,
  GitBranch,
  SlidersHorizontal,
  Eye,
  AlertTriangle,
  Plus
} from "lucide-react";
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  namespace: string;
  description?: string;
  version?: string;
  is_active?: boolean;
  merge_strategy?: string;
  priority?: number;
  dependencies?: string[];
}

interface ModuleSelectionProps {
  control: Control<any>;
  watch: any;
  setValue: any;
  errors: any;
}

const ModuleSelectionStep = ({ control, watch, setValue, errors }: ModuleSelectionProps) => {
  const [profiles, setProfiles] = useState<Record<string, Profile[]>>({
    containers: [],
    volumes: [],
    resources: [],
    probes: [],
    scheduling: [],
    env: [],
    lifecycle: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>("containers");

  const watchedValues = watch();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const profileTypes = ['container', 'volume', 'resource', 'probe', 'scheduling', 'env', 'lifecycle'];
      const profilePromises = profileTypes.map(type =>
        fetch(`/api/integration/kubernetes/library/${type}s`).then(res => res.json())
      );

      const results = await Promise.allSettled(profilePromises);
      const fetchedProfiles: Record<string, Profile[]> = {};

      profileTypes.forEach((type, index) => {
        const typeName = `${type}s`;
        if (results[index].status === 'fulfilled') {
          fetchedProfiles[typeName] = results[index].value || [];
        } else {
          fetchedProfiles[typeName] = [];
        }
      });

      setProfiles(fetchedProfiles);
    } catch (error) {
      toast.error("Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelection = (moduleType: string, profileId: string, checked: boolean) => {
    const fieldName = `${moduleType}_profile_ids`;
    const currentSelections = watchedValues[fieldName] || [];
    const newSelections = checked
      ? [...currentSelections, profileId]
      : currentSelections.filter((id: string) => id !== profileId);

    setValue(fieldName, newSelections);
  };

  const getModuleIcon = (moduleType: string) => {
    const icons: Record<string, any> = {
      containers: Container,
      volumes: Database,
      resources: Cpu,
      probes: Activity,
      scheduling: GitBranch,
      env: SlidersHorizontal,
      lifecycle: SlidersHorizontal
    };
    return icons[moduleType] || Container;
  };

  const getModuleDescription = (moduleType: string) => {
    const descriptions: Record<string, string> = {
      containers: "Reusable container configurations with images, ports, and runtime settings",
      volumes: "Persistent volume configurations for storage and data persistence",
      resources: "CPU and memory resource limits and requests",
      probes: "Health check configurations for liveness, readiness, and startup probes",
      scheduling: "Node scheduling, affinity, and toleration configurations",
      env: "Environment variables and configuration management",
      lifecycle: "Container lifecycle hooks for post-start and pre-stop actions"
    };
    return descriptions[moduleType] || "";
  };

  const renderProfileList = (moduleType: string, moduleProfiles: Profile[]) => {
    const fieldName = `${moduleType}_profile_ids`;
    const selectedProfiles = watchedValues[fieldName] || [];
    const Icon = getModuleIcon(moduleType);

    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    if (moduleProfiles.length === 0) {
      const singularModule = moduleType.slice(0, -1);
      return (
        <div className="text-center py-8">
          <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No {moduleType} profiles</h3>
          <p className="text-gray-500 mb-4">Create your first {singularModule} profile to get started</p>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create {singularModule} profile
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {moduleProfiles.map((profile) => {
          const isSelected = selectedProfiles.includes(profile.id);
          const hasDependencies = profile.dependencies && profile.dependencies.length > 0;

          return (
            <Card
              key={profile.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              onClick={() => handleProfileSelection(moduleType.slice(0, -1), profile.id, !isSelected)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) =>
                        handleProfileSelection(moduleType.slice(0, -1), profile.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <CardTitle className="text-sm font-medium">{profile.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {profile.description || `${moduleType.slice(0, -1)} profile`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.version && (
                      <Badge variant="outline" className="text-xs">
                        v{profile.version}
                      </Badge>
                    )}
                    {profile.merge_strategy && (
                      <Badge variant="secondary" className="text-xs">
                        {profile.merge_strategy}
                      </Badge>
                    )}
                    {!profile.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{profile.namespace}</span>
                  {hasDependencies && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{profile.dependencies?.length} dependencies</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const getTotalSelectedCount = () => {
    return Object.keys(profiles).reduce((total, moduleType) => {
      const singularModule = moduleType.slice(0, -1);
      const fieldName = `${singularModule}_profile_ids`;
      const selections = watchedValues[fieldName] || [];
      return total + selections.length;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Composable Modules</h3>
          <p className="text-sm text-muted-foreground">
            Choose reusable profiles to compose into your deployment. Multiple profiles per type are supported.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <Eye className="h-3 w-3" />
          <span>{getTotalSelectedCount()} selected</span>
        </Badge>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {Object.keys(profiles).map((moduleType) => {
            const Icon = getModuleIcon(moduleType);
            const singularModule = moduleType.slice(0, -1);
            const fieldName = `${singularModule}_profile_ids`;
            const selectedCount = (watchedValues[fieldName] || []).length;

            return (
              <TabsTrigger key={moduleType} value={moduleType} className="flex items-center space-x-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{moduleType}</span>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(profiles).map(([moduleType, moduleProfiles]) => (
          <TabsContent key={moduleType} value={moduleType} className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  {React.createElement(getModuleIcon(moduleType), { className: "h-5 w-5" })}
                </div>
                <div>
                  <h4 className="font-medium capitalize">{moduleType}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getModuleDescription(moduleType)}
                  </p>
                </div>
              </div>

              {renderProfileList(moduleType, moduleProfiles)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <h5 className="font-medium text-blue-900 mb-1">Module Composition</h5>
            <p className="text-blue-800">
              Selected modules will be composed at deployment runtime using their merge strategies.
              Conflicts are resolved based on priority and merge order. Use to Preview step to see the final result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelectionStep;