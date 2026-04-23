import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Key,
    Plus,
    RefreshCw,
    Trash2,
    User,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Pencil,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/kubernetes/dashboard/resourceCard";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import FormWizard from "@/components/wizard/form-wizard";
import * as z from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageLayout from "@/components/PageLayout";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { useContext } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_VERBS = ["get", "list", "watch", "create", "update", "patch", "delete", "exec"];

const ROLE_TEMPLATE_LABELS: Record<string, string> = {
    read_only: "Read Only",
    developer: "Developer",
    ops: "Ops",
    admin: "Admin",
    custom: "Custom",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomRule {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
    nonResourceURLs: string[];
}

interface UserAccess {
    id: number;
    name: string;
    namespace: string;
    description: string;
    created_at: string;
    age: string;
    role_template: string;
    expires_at: string;
    is_active: boolean;
    revoked_at?: string;
    status?: string;
    error_message?: string;
    custom_rules?: string; // JSON-encoded list of PolicyRule dicts
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const accessSchema = z.object({
    name: z.string().min(1, "User name is required"),
    namespace: z.string().min(1, "Namespace is required"),
    description: z.string().optional(),
    role_template: z.enum(["read_only", "developer", "ops", "admin", "custom"]),
    token_expiry_hours: z.number().min(1).max(720).default(168),
    custom_rules: z.array(z.object({
        apiGroups: z.array(z.string()),
        resources: z.array(z.string()),
        verbs: z.array(z.string()),
        nonResourceURLs: z.array(z.string()).optional(),
    })).optional(),
    isEditMode: z.boolean().optional(),
});

// ─── ChipInput ────────────────────────────────────────────────────────────────

const ChipInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    placeholder?: string;
}) => {
    const [inputVal, setInputVal] = useState("");

    const addChip = (raw: string) => {
        const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
        const next = [...value];
        parts.forEach(p => { if (!next.includes(p)) next.push(p); });
        onChange(next);
        setInputVal("");
    };

    return (
        <div className="flex flex-wrap gap-1 items-center min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-ring cursor-text">
            {value.map((chip, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold"
                >
                    {chip}
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((_, j) => j !== i))}
                        className="hover:bg-secondary/80 rounded-full transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        if (inputVal) addChip(inputVal);
                    }
                    if (e.key === "Backspace" && !inputVal && value.length > 0) {
                        onChange(value.slice(0, -1));
                    }
                }}
                onBlur={() => { if (inputVal) addChip(inputVal); }}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 bg-transparent outline-none min-w-[100px] placeholder:text-muted-foreground"
            />
        </div>
    );
};

// ─── VerbToggleGroup ──────────────────────────────────────────────────────────

const VerbToggleGroup = ({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) => {
    const toggle = (verb: string) => {
        if (value.includes(verb)) {
            onChange(value.filter(v => v !== verb));
        } else {
            onChange([...value, verb]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {RULE_VERBS.map(verb => {
                const active = value.includes(verb);
                return (
                    <button
                        key={verb}
                        type="button"
                        onClick={() => toggle(verb)}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border px-3 py-1 ${active
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        {verb}
                    </button>
                );
            })}
        </div>
    );
};

// ─── RuleCard (works with react-hook-form useFieldArray) ──────────────────────

const RuleCard = ({
    index,
    watch,
    update,
    remove,
    showNonResourceURLs,
    onToggleNonResourceURLs,
}: {
    index: number;
    watch: any;
    update: (index: number, val: any) => void;
    remove: (index: number) => void;
    showNonResourceURLs: boolean;
    onToggleNonResourceURLs: () => void;
}) => {
    const rule = watch(`custom_rules.${index}`) ?? {
        apiGroups: [""],
        resources: [],
        verbs: ["get", "list", "watch"],
        nonResourceURLs: [],
    };

    const set = (key: keyof CustomRule, val: string[]) =>
        update(index, { ...rule, [key]: val });

    return (
        <div className="border rounded-md p-4 space-y-4 bg-background relative group shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium leading-none">
                    Rule {index + 1}
                </span>
                <button
                    type="button"
                    onClick={() => remove(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        API Groups
                        <span className="ml-2 font-normal text-muted-foreground text-xs">(e.g. "", apps)</span>
                    </label>
                    <ChipInput
                        value={rule.apiGroups ?? [""]}
                        onChange={v => set("apiGroups", v)}
                        placeholder={`"" apps batch`}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Resources
                    </label>
                    <ChipInput
                        value={rule.resources ?? []}
                        onChange={v => set("resources", v)}
                        placeholder="pods services deployments"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Verbs
                </label>
                <VerbToggleGroup
                    value={rule.verbs ?? []}
                    onChange={v => set("verbs", v)}
                />
            </div>

            {/* Non-resource URLs — optional advanced field */}
            <div>
                <button
                    type="button"
                    onClick={onToggleNonResourceURLs}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                    {showNonResourceURLs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showNonResourceURLs ? "Hide" : "Show"} Non-Resource URLs (advanced)
                </button>
                {showNonResourceURLs && (
                    <div className="mt-3">
                        <ChipInput
                            value={rule.nonResourceURLs ?? []}
                            onChange={v => set("nonResourceURLs", v)}
                            placeholder="/healthz  /metrics"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── CustomRuleBuilder (FormWizard step version) ───────────────────────────────

const CustomRuleBuilder = ({ control, watch }: { control: any; watch: any }) => {
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "custom_rules",
    });
    const [openNonResource, setOpenNonResource] = useState<Record<number, boolean>>({});

    const toggleNonResource = (i: number) =>
        setOpenNonResource(prev => ({ ...prev, [i]: !prev[i] }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">Policy Rules</label>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Define the Kubernetes RBAC rules for this role.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        append({
                            apiGroups: [""],
                            resources: [],
                            verbs: ["get", "list", "watch"],
                            nonResourceURLs: [],
                        })
                    }
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                </Button>
            </div>

            {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground text-xs space-y-1">
                    <Shield className="w-6 h-6 mx-auto opacity-30" />
                    <p>No rules defined. Click "Add Rule" to start building your custom role.</p>
                </div>
            )}

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {fields.map((field, idx) => (
                    <RuleCard
                        key={field.id}
                        index={idx}
                        watch={watch}
                        update={update}
                        remove={remove}
                        showNonResourceURLs={!!openNonResource[idx]}
                        onToggleNonResourceURLs={() => toggleNonResource(idx)}
                    />
                ))}
            </div>
        </div>
    );
};

// Removed EditRuleCard completely since CustomRuleBuilder handles exactly this functionality.

// EditRoleDialog logic entirely decoupled and removed in favor of FormWizard Edit mode usage.

// ─── Form Steps ───────────────────────────────────────────────────────────────

const AccessFormStep1 = ({ control, watch }: { control: any; watch: any }) => {
    const { namespaces } = useContext(NamespaceContext);
    const isEditMode = watch("isEditMode");

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>User Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., dev-john" {...field} disabled={isEditMode} />
                        </FormControl>
                        {isEditMode && <FormDescription>Username cannot be changed after creation.</FormDescription>}
                        {!isEditMode && <FormDescription>A descriptive name for this access credential.</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="namespace"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Namespace</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                            <FormControl>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select namespace" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                {namespaces?.map((ns: any) => (
                                    <SelectItem key={ns.metadata?.name} value={ns.metadata?.name}>
                                        {ns.metadata?.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isEditMode && <FormDescription>Namespace cannot be changed after creation.</FormDescription>}
                        {!isEditMode && <FormDescription>The Kubernetes namespace this access will be scoped to.</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Frontend developer access" {...field} disabled={isEditMode} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

const AccessFormStep2 = ({ control, watch }: { control: any; watch: any }) => {
    const roleTemplate = watch("role_template");

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="role_template"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Role Template</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                <SelectItem value="read_only" className="flex flex-col items-start gap-1">
                                    <span className="font-medium">Read Only</span>
                                    <span className="text-[10px] text-muted-foreground">View-only access (get, list, watch)</span>
                                </SelectItem>
                                <SelectItem value="developer" className="flex flex-col items-start gap-1">
                                    <span className="font-medium">Developer</span>
                                    <span className="text-[10px] text-muted-foreground">Standard developer access (create, edit, delete, exec)</span>
                                </SelectItem>
                                <SelectItem value="ops" className="flex flex-col items-start gap-1">
                                    <span className="font-medium">Ops</span>
                                    <span className="text-[10px] text-muted-foreground">Operations access (full CRUD + debugging)</span>
                                </SelectItem>
                                <SelectItem value="admin" className="flex flex-col items-start gap-1">
                                    <span className="font-medium">Admin</span>
                                    <span className="text-[10px] text-muted-foreground">Full admin access to namespace</span>
                                </SelectItem>
                                <SelectItem value="custom" className="flex flex-col items-start gap-1">
                                    <span className="font-medium">Custom</span>
                                    <span className="text-[10px] text-muted-foreground">Define your own permissions</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="token_expiry_hours"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Token Expiry</FormLabel>
                        <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            defaultValue={String(field.value)}
                        >
                            <FormControl>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select expiry" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border-border/50">
                                <SelectItem value="1">1 hour</SelectItem>
                                <SelectItem value="8">8 hours</SelectItem>
                                <SelectItem value="24">24 hours</SelectItem>
                                <SelectItem value="72">3 days</SelectItem>
                                <SelectItem value="168">7 days</SelectItem>
                                <SelectItem value="720">30 days</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            How long this token will be valid.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Custom rule builder — slides in when "custom" is chosen */}
            {roleTemplate === "custom" && (
                <div className="pt-2 border-t border-border/30">
                    <CustomRuleBuilder control={control} watch={watch} />
                </div>
            )}

            {roleTemplate !== "custom" && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-primary/80 text-[11px] font-medium flex gap-3">
                    <Shield className="w-4 h-4 shrink-0 text-primary" />
                    <p>A ServiceAccount will be created in the namespace with the selected role. A kubeconfig file will be generated with a token.</p>
                </div>
            )}
        </div>
    );
};

const AccessFormStep3 = ({ watch }: { watch: any }) => {
    const values = watch();
    const isValid = values.name && values.namespace && values.role_template;
    const isCustom = values.role_template === "custom";
    const rules: any[] = values.custom_rules ?? [];

    return (
        <div className="space-y-6">
            <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <h4 className="font-semibold text-foreground">Access Summary</h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">User Name:</span>
                        <span className="ml-2 font-medium">{values.name || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Namespace:</span>
                        <span className="ml-2 font-medium">{values.namespace || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Role:</span>
                        <span className="ml-2 font-medium capitalize">
                            {ROLE_TEMPLATE_LABELS[values.role_template] ?? values.role_template ?? "-"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="ml-2 font-medium">{values.token_expiry_hours}h</span>
                    </div>
                </div>

                {values.description && (
                    <div className="pt-2 border-t">
                        <span className="text-muted-foreground">Description:</span>
                        <span className="ml-2">{values.description}</span>
                    </div>
                )}

                {/* Custom rules summary */}
                {isCustom && rules.length > 0 && (
                    <div className="pt-3 border-t border-border/30 space-y-2">
                        <span className="text-sm text-muted-foreground font-medium">Custom Rules ({rules.length})</span>
                        <div className="space-y-2">
                            {rules.map((rule, i) => (
                                <div key={i} className="p-3 bg-background/60 rounded-lg border border-border/30 text-xs space-y-1.5">
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-muted-foreground mr-1">API Groups:</span>
                                        {(rule.apiGroups ?? []).map((g: string, j: number) => (
                                            <Badge key={j} variant="outline" className="text-[10px] px-1.5 font-mono">
                                                {g === "" ? '""' : g}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-muted-foreground mr-1">Resources:</span>
                                        {(rule.resources ?? []).map((r: string, j: number) => (
                                            <Badge key={j} variant="outline" className="text-[10px] px-1.5">
                                                {r}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-muted-foreground mr-1">Verbs:</span>
                                        {(rule.verbs ?? []).map((v: string, j: number) => (
                                            <Badge key={j} className="text-[10px] px-1.5 bg-primary/10 text-primary border-none">
                                                {v}
                                            </Badge>
                                        ))}
                                    </div>
                                    {(rule.nonResourceURLs ?? []).length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-muted-foreground mr-1">Non-Resource URLs:</span>
                                            {rule.nonResourceURLs.map((u: string, j: number) => (
                                                <Badge key={j} variant="outline" className="text-[10px] px-1.5 font-mono">
                                                    {u}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isCustom && rules.length === 0 && (
                    <div className="pt-2 border-t">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-xs flex gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <p>No custom rules defined. Go back to Permissions and add at least one rule.</p>
                        </div>
                    </div>
                )}
            </div>

            {!isValid && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm flex gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p>Please complete all required fields in previous steps.</p>
                </div>
            )}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const RBACPage = () => {
    const { selectedNamespace, namespaces, fetchNamespaces } = useContext(NamespaceContext);

    const [users, setUsers] = useState<UserAccess[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState("details");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    // Edit Role dialog state
    const [editRoleAccess, setEditRoleAccess] = useState<UserAccess | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        namespace: selectedNamespace || "default",
        description: "",
        role_template: "developer" as const,
        token_expiry_hours: 168,
        custom_rules: [] as any[],
    });

    useEffect(() => {
        if (selectedNamespace) {
            fetchUsers(selectedNamespace);
        }
    }, [selectedNamespace]);

    const fetchUsers = async (namespace: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/kubernertes/rbac?namespace=${namespace}`);
            const data = await res.json();
            setUsers(data?.users || []);
        } catch (err: any) {
            toast.error(err.message || String(err));
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccess = async (values: z.infer<typeof accessSchema>) => {
        try {
            if (editRoleAccess) {
                const body: any = { action: "change_role", role_template: values.role_template };
                if (values.role_template === "custom" && values.custom_rules?.length) {
                    body.custom_rules = values.custom_rules;
                }
                const res = await fetch(`/api/kubernertes/rbac/${editRoleAccess.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (res.ok) {
                    toast.success("Role updated successfully");
                    setIsWizardOpen(false);
                    setCurrentStep("details");
                    setEditRoleAccess(null);
                    fetchUsers(values.namespace);
                } else {
                    toast.error(data?.error || "Failed to update role");
                }
                return;
            }

            const body: any = {
                service_account_name: values.name,
                namespace: values.namespace,
                role_template: values.role_template,
                token_expiry_hours: values.token_expiry_hours,
                description: values.description || "",
            };
            if (values.role_template === "custom" && values.custom_rules?.length) {
                body.custom_rules = values.custom_rules;
            }

            const res = await fetch(`/api/kubernertes/rbac?namespace=${values.namespace}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.status === "pending") {
                    if (data.message?.includes("Retrying")) {
                        toast.info("Retrying failed request…");
                    } else {
                        toast.success("Access request created. It will be ready shortly.");
                    }
                }
                setIsWizardOpen(false);
                setCurrentStep("details");
                setFormData({
                    name: "",
                    namespace: selectedNamespace || "default",
                    description: "",
                    role_template: "developer",
                    token_expiry_hours: 168,
                    custom_rules: [],
                });
                fetchUsers(values.namespace);
            } else {
                toast.error(data?.error || "Failed to create access");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create access");
        }
    };

    const wizardInitialValues = useMemo(() => {
        if (editRoleAccess) {
            let parsedRules = [];
            if (editRoleAccess.role_template === "custom" && editRoleAccess.custom_rules) {
                try {
                    const raw = editRoleAccess.custom_rules;
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    parsedRules = (parsed as any[]).map(r => ({
                        apiGroups: r.apiGroups || r.api_groups || [],
                        resources: r.resources || [],
                        verbs: r.verbs || [],
                        nonResourceURLs: r.nonResourceURLs || r.non_resource_ur_ls || r.non_resource_urls || [],
                    }));
                } catch {
                    parsedRules = [];
                }
            }
            return {
                name: editRoleAccess.name,
                namespace: editRoleAccess.namespace,
                description: editRoleAccess.description || "",
                role_template: editRoleAccess.role_template as any,
                token_expiry_hours: 168,
                custom_rules: parsedRules,
                isEditMode: true,
            };
        }
        return {
            name: formData.name,
            namespace: formData.namespace,
            description: formData.description,
            role_template: formData.role_template,
            token_expiry_hours: formData.token_expiry_hours,
            custom_rules: formData.custom_rules,
            isEditMode: false,
        };
    }, [editRoleAccess, formData]);

    const confirmRevoke = async () => {
        if (!idToDelete) return;
        try {
            await fetch(`/api/kubernertes/rbac/${idToDelete}?action=revoke`, { method: "DELETE" });
            toast.success("Access revoked successfully");
            fetchUsers(selectedNamespace);
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await fetch(`/api/kubernertes/rbac/${idToDelete}?action=delete`, { method: "DELETE" });
            toast.success("Access deleted successfully");
            fetchUsers(selectedNamespace);
        } catch (err: any) {
            toast.error(err.message || String(err));
        } finally {
            setDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleRegenerateToken = async (id: number) => {
        try {
            const res = await fetch(`/api/kubernertes/rbac/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "regenerate_token" }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.info("Token regeneration initiated. Processing in background.");
                fetchUsers(selectedNamespace);
            } else {
                toast.error(data?.error || "Failed to regenerate token");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to regenerate token");
        }
    };

    const handleRetry = async (row: UserAccess) => {
        try {
            const res = await fetch(`/api/kubernertes/rbac`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_account_name: row.name,
                    namespace: row.namespace,
                    role_template: row.role_template,
                    token_expiry_hours: 168,
                    description: row.description,
                    ...(row.role_template === "custom" && row.custom_rules
                        ? { custom_rules: JSON.parse(row.custom_rules) }
                        : {}),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.info("Retrying failed request…");
                fetchUsers(row.namespace);
            } else {
                toast.error(data?.error || "Failed to retry");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to retry");
        }
    };

    const handleDownload = async (id: number) => {
        try {
            const res = await fetch(`/api/kubernertes/rbac/${id}`);
            const data = await res.json();
            if (res.ok && data.kubeconfig) {
                const kubeconfig = data.kubeconfig;
                const yamlContent = `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${kubeconfig.clusters?.[0]?.cluster?.['certificate-authority-data'] || ''}
    server: ${kubeconfig.clusters?.[0]?.cluster?.server || ''}
  name: ${kubeconfig.clusters?.[0]?.name || 'kubernetes'}
contexts:
- context:
    cluster: ${kubeconfig.clusters?.[0]?.name || 'kubernetes'}
    namespace: ${data.namespace || 'default'}
    user: ${data.name || 'user'}
  name: ${data.namespace || 'default'}-${data.name || 'user'}
current-context: ${data.namespace || 'default'}-${data.name || 'user'}
kind: Config
users:
- name: ${data.name || 'user'}
  user:
    token: ${kubeconfig.users?.[0]?.user?.token || ''}
`;
                const blob = new Blob([yamlContent], { type: "text/yaml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `kubeconfig-${data.name}.yaml`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Kubeconfig downloaded");
            } else {
                toast.error(data?.error || "Kubeconfig not ready");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to download");
        }
    };

    const columns = useMemo(() => [
        {
            header: "User",
            accessor: "name",
            cell: (row: UserAccess) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{row.name}</span>
                    {row.description && (
                        <span className="text-[10px] text-muted-foreground">{row.description}</span>
                    )}
                </div>
            ),
        },
        {
            header: "Namespace",
            accessor: "namespace",
            cell: (row: UserAccess) => (
                <Badge variant="outline" className="text-[10px]">
                    {row.namespace}
                </Badge>
            ),
        },
        {
            header: "Role",
            accessor: "role_template",
            cell: (row: UserAccess) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium capitalize">
                        {ROLE_TEMPLATE_LABELS[row.role_template] ?? row.role_template?.replace("_", " ")}
                    </span>
                    {row.role_template === "custom" && (
                        <Badge className="text-[9px] px-1.5 bg-violet-500/10 text-violet-500 border-none h-4">
                            custom
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            header: "Created",
            accessor: "created_at",
            cell: (row: UserAccess) => (
                <span className="text-muted-foreground text-[10px]">
                    {row.age || "-"}
                </span>
            ),
        },
        {
            header: "Status",
            accessor: "status",
            cell: (row: UserAccess) => {
                if (!row.is_active) {
                    return <Badge variant="destructive" className="text-[10px]">Revoked</Badge>;
                }
                if (row.status === "pending") {
                    return <Badge className="bg-blue-500/10 text-blue-600 border-none text-[10px]">Pending</Badge>;
                }
                if (row.status === "regenerating") {
                    return <Badge className="bg-amber-500/10 text-amber-600 border-none text-[10px]">Regenerating</Badge>;
                }
                if (row.status === "failed") {
                    return (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 text-[10px] cursor-help" title={row.error_message || "Generation failed"}>
                            Failed
                        </Badge>
                    );
                }
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">Ready</Badge>;
            },
        },
        {
            header: "Expires",
            accessor: "expires_at",
            cell: (row: UserAccess) => (
                <span className="text-muted-foreground text-[10px]">
                    {row.expires_at ? new Date(row.expires_at).toLocaleString() : "-"}
                </span>
            ),
        },
        {
            header: "Error",
            accessor: "error_message",
            cell: (row: UserAccess) => (
                row.error_message ? (
                    <span className="text-red-500 text-[10px] max-w-[150px] truncate block" title={row.error_message}>
                        {row.error_message}
                    </span>
                ) : <span className="text-muted-foreground text-[10px]">-</span>
            ),
        },
    ], []);

    const wizardSteps = [
        {
            id: "details",
            label: "User Details",
            description: "Basic information",
            longDescription: "Enter the user name, namespace, and description for this access.",
            icon: User,
            component: AccessFormStep1,
        },
        {
            id: "permissions",
            label: "Permissions",
            description: "Access level & expiry",
            longDescription: "Select the role template and token expiry duration.",
            icon: Shield,
            component: AccessFormStep2,
        },
        {
            id: "review",
            label: "Review",
            description: "Generate kubeconfig",
            longDescription: "Review and generate the kubeconfig file.",
            icon: Key,
            component: AccessFormStep3,
        },
    ];

    const activeUsers = users.filter((u) => u.is_active);
    const revokedUsers = users.filter((u) => !u.is_active);

    return (
        <PageLayout
            title="User Access Management"
            subtitle="Manage developer access to your Kubernetes cluster with secure kubeconfig generation."
            icon={Key}
            actions={
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers(selectedNamespace)}
                        disabled={loading}
                        className="gap-2 border-border/50"
                    >
                        <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
                        Sync
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                            setFormData({
                                name: "",
                                namespace: selectedNamespace || "default",
                                description: "",
                                role_template: "developer",
                                token_expiry_hours: 168,
                                custom_rules: [],
                            });
                            setCurrentStep("details");
                            setIsWizardOpen(true);
                        }}
                        className="gap-2 shadow-lg shadow-primary/20 bg-primary h-9"
                    >
                        <Plus size={16} />
                        Generate Access
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
                <ResourceCard
                    title="Total Users"
                    count={users.length}
                    icon={<User className="w-4 h-4" />}
                    color="bg-primary"
                    className="border-primary/10 bg-primary/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Active"
                    count={activeUsers.length}
                    icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                    color="bg-emerald-500"
                    className="border-emerald-500/10 bg-emerald-500/5 shadow-none"
                    isLoading={loading}
                />
                <ResourceCard
                    title="Revoked"
                    count={revokedUsers.length}
                    icon={<XCircle className="w-4 h-4 text-red-500" />}
                    color="bg-red-500"
                    className="border-red-500/10 bg-red-500/5 shadow-none"
                    isLoading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 mt-6">
                <ResourceTable
                    data={users}
                    columns={columns}
                    loading={loading}
                    title="User Access"
                    description="All generated kubeconfigs for this namespace."
                    icon={<Key className="w-4 h-4" />}
                    onDelete={(row) => {
                        setIdToDelete(row.id);
                        setDeleteDialogOpen(true);
                    }}
                    customActions={[
                        {
                            label: "Download",
                            icon: Key,
                            onClick: (row) => handleDownload(row.id),
                            show: (row) => row.is_active && row.status === "ready",
                        },
                        {
                            label: "Edit Role",
                            icon: Pencil,
                            onClick: (row) => {
                                setEditRoleAccess(row);
                                setCurrentStep("details");
                                setIsWizardOpen(true);
                            },
                            show: (row) => row.is_active && row.status === "ready",
                        },
                        {
                            label: "Regenerate Token",
                            icon: RefreshCw,
                            onClick: (row) => handleRegenerateToken(row.id),
                            show: (row) => !row.is_active,
                        },
                        {
                            label: "Retry",
                            icon: RefreshCw,
                            onClick: (row) => handleRetry(row),
                            show: (row) => row.is_active && row.status === "failed",
                        },
                    ]}
                />
            </div>

            <FormWizard
                name="generate-access-wizard"
                isWizardOpen={isWizardOpen}
                setIsWizardOpen={(val) => {
                    setIsWizardOpen(val);
                    if (!val) setEditRoleAccess(null);
                }}
                steps={wizardSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                initialValues={wizardInitialValues}
                schema={accessSchema}
                onSubmit={handleCreateAccess}
                heading={{
                    primary: editRoleAccess ? "Edit Role Permissions" : "Generate Developer Access",
                    secondary: editRoleAccess ? "Change the role template and modify custom rules." : "Create a new ServiceAccount with RBAC role for secure cluster access.",
                    icon: editRoleAccess ? Pencil : Key,
                }}
                submitLabel={editRoleAccess ? "Update" : "Generate"}
                submitIcon={editRoleAccess ? RefreshCw : Plus}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Access?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="text-foreground/80">
                                Choose an action:
                            </p>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2">
                                <p className="text-xs leading-relaxed text-destructive font-medium">
                                    Revoke: Removes RBAC (keeps SA, removes role & bindings)
                                </p>
                                <p className="text-xs leading-relaxed text-destructive font-medium">
                                    Delete: Removes record from database permanently
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel
                            className="bg-muted hover:bg-muted/80 text-foreground border-none h-10 px-6"
                            onClick={confirmRevoke}
                        >
                            Revoke
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20 h-10 px-6"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    );
};

export default RBACPage;