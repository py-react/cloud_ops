import {
  Box,
  Boxes,
  KeyRound,
  Network,
  Shield,
  FileKey,
  BadgeCheck,
  Key,
  Users,
  Workflow,
  Cpu,
  HardDrive,
  Database,
  Settings,
  Lock,
  Scale,
  Timer,
  Gauge,
  ShieldAlert,
  Webhook,
  LucideIcon
} from 'lucide-react';

export const resourceIconMap: Record<string, LucideIcon> = {
  // Core Resources
  pods: Box,
  services: Network,
  configmaps: Database,
  secrets: KeyRound,
  namespaces: Boxes,
  nodes: HardDrive,
  persistentvolumes: HardDrive,
  persistentvolumeclaims: HardDrive,
  
  // Workload Resources
  deployments: Workflow,
  statefulsets: Database,
  daemonsets: Cpu,
  replicasets: Boxes,
  jobs: Timer,
  cronjobs: Timer,
  
  // Networking Resources
  ingresses: Network,
  networkpolicies: Shield,
  endpoints: Network,
  
  // RBAC Resources
  serviceaccounts: Users,
  roles: Shield,
  rolebindings: Shield,
  clusterroles: Shield,
  clusterrolebindings: Shield,
  
  // Storage Resources
  storageclasses: HardDrive,
  volumeattachments: HardDrive,
  
  // Auth & Security
  certificatesigningrequests: FileKey,
  certificates: BadgeCheck,
  issuers: Key,
  
  // Config & Storage
  customresourcedefinitions: Settings,
  validatingwebhookconfigurations: Webhook,
  mutatingwebhookconfigurations: Webhook,
  
  // Autoscaling
  horizontalpodautoscalers: Scale,
  verticalpodautoscalers: Scale,
  
  // Policy
  poddisruptionbudgets: ShieldAlert,
  resourcequotas: Gauge,
  limitranges: Gauge,
  
  // Default icon for unknown resources
  default: Settings
};

export function getResourceIcon(resourceType: string): LucideIcon {
  const normalizedType = resourceType.toLowerCase();
  return resourceIconMap[normalizedType] || resourceIconMap.default;
} 