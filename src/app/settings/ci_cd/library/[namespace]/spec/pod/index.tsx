import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Container, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import ResourceCard from "@/components/kubernetes/dashboard/resourceCard";
import { BasicConfig, AdvancedConfig } from "@/components/ciCd/library/derivedContainer/forms/DerivedContainerForm";
import { DerivedContainerList } from "@/components/ciCd/library/derivedContainer/DerivedContainerList";
import { DefaultService } from "@/gingerJs_api_client";

function jsonToYaml(obj: any) {
    const YAML = require('js-yaml');
    return YAML.dump(obj, { sortKeys: false });
}

const defaultValues = {
    name: "",
    namespace: "",
    description: "",
    image_pull_policy: "IfNotPresent",
    command: new Set(),
    args: new Set(),
    working_dir: "",
    profile: {},
}

const createContainerProfileSchema = z.object({
    name: z.string().min(1, "Container name is required"),
    description: z.string().min(1, "Container description is required"),
    namespace: z.string().min(1, "Namespace is required"),
    image_pull_policy: z.string().optional(),
    command: z.any().optional(),
    args: z.any().optional(),
    working_dir: z.string().optional(),
    profile: z.any().optional()
});

const steps = [
    {
        id: 'basic',
        label: 'Basic Info',
        description: 'Container configuration',
        longDescription: 'Configure the basic container settings including name, image, and pull policy.',
        component: BasicConfig,
    },
    {
        id: 'advanced',
        label: 'View',
        description: 'View Your Container',
        longDescription: 'View your container in yaml format for ease',
        component: AdvancedConfig,
    },
]

function ContainerLibrary() {
    const [activeTab, setActiveTab] = useState("basic");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { selectedNamespace } = useContext(NamespaceContext);

    useEffect(() => { fetchProfiles(); }, [selectedNamespace]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await DefaultService.apiIntegrationKubernetesLibraryContainerGet({ namespace: selectedNamespace });
            setProfiles(data as any[]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {

        const valueProfiles = { ...values.profile }
        const transformedProfile: any = {}

        Object.keys(valueProfiles).map(key => {
            transformedProfile[key] = valueProfiles[key].id
        })

        const payload = {
            ...values,
            profile: transformedProfile
        };
        console.log({ payload })

        try {
            const response = await fetch("/api/integration/kubernetes/library/container", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                toast.success("Profile created");
                setDialogOpen(false);
                fetchProfiles();
            }
        } catch (error) {
            toast.error("Error saving profile");
        }
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-fade-in space-y-4 overflow-hidden pr-1">
            <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border/100 pb-2 mb-2">
                <div>
                    <div className="flex items-center gap-4 mb-1 p-1">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                            <Container className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground uppercase tracking-widest">Container Profiles</h1>
                            <p className="text-muted-foreground text-[13px] font-medium leading-tight max-w-2xl px-1 mt-2">
                                Define container configurations for deployments in <span className="text-primary font-bold">{selectedNamespace}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <NamespaceSelector />
                    <Button variant="outline" size="sm" onClick={fetchProfiles}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Profile
                    </Button>
                </div>
            </div>
            <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-0">
                <ResourceCard
                    title="Total Profiles"
                    count={profiles.length}
                    icon={<Container className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/20 bg-primary/5 shadow-none hover:border-primary/30 transition-all"
                    isLoading={loading}
                />
            </div>
            <DerivedContainerList
                profiles={profiles}
                loading={loading}
                selectedNamespace={selectedNamespace}
                onDelete={() => fetchProfiles()}
            />

            <FormWizard
                name="create-container-profile"
                isWizardOpen={dialogOpen}
                setIsWizardOpen={setDialogOpen}
                currentStep={activeTab}
                setCurrentStep={setActiveTab}
                steps={steps}
                schema={createContainerProfileSchema as z.ZodSchema<any>}
                initialValues={defaultValues}
                onSubmit={handleSubmit}
                submitLabel="Create Container Profile"
                submitIcon={Container}
                heading={{
                    primary: "Create Container Profile",
                    secondary: "Configure a new container profile for your deployments",
                    icon: Container,
                }}

            />

        </div>
    );
}

export default ContainerLibrary;


