import React, { useState, useEffect,createContext, startTransition, useMemo, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { matchPath } from 'react-router';

                            //import Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/index.js'
                            const Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/index.tsx'));
                        

                            //import Layout from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/layout.js'
                            const Layout = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/layout.tsx'));
                        

                            //import Settings_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/index.js'
                            const Settings_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/index.tsx'));
                        

                            //import Settings_Docker_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/docker/index.js'
                            const Settings_Docker_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/docker/index.tsx'));
                        

                            //import Settings_Docker_Config_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/docker/config/index.js'
                            const Settings_Docker_Config_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/docker/config/index.tsx'));
                        

                            //import Settings_Docker_Registry_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/docker/registry/index.js'
                            const Settings_Docker_Registry_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/docker/registry/index.tsx'));
                        

                            //import Settings_Docker_Registry_Image_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/docker/registry/[image]/index.js'
                            const Settings_Docker_Registry_Image_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/docker/registry/[image]/index.tsx'));
                        

                            //import Settings_Docker_Registry_Image_Tag_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/docker/registry/[image]/[tag]/index.js'
                            const Settings_Docker_Registry_Image_Tag_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/docker/registry/[image]/[tag]/index.tsx'));
                        

                            //import Settings_Ci_Cd_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/index.js'
                            const Settings_Ci_Cd_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/index.tsx'));
                        

                            //import Settings_Ci_Cd_Release_Strategies_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/release_strategies/index.js'
                            const Settings_Ci_Cd_Release_Strategies_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/release_strategies/index.tsx'));
                        

                            //import Settings_Ci_Cd_Library_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/library/index.js'
                            const Settings_Ci_Cd_Library_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/library/index.tsx'));
                        

                            //import Settings_Ci_Cd_Library_Templatename_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/library/[templateName]/index.js'
                            const Settings_Ci_Cd_Library_Templatename_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/library/[templateName]/index.tsx'));
                        

                            //import Settings_Ci_Cd_Release_Control_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/release_control/index.js'
                            const Settings_Ci_Cd_Release_Control_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/release_control/index.tsx'));
                        

                            //import Settings_Ci_Cd_Deployment_Strategy_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/deployment_strategy/index.js'
                            const Settings_Ci_Cd_Deployment_Strategy_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/deployment_strategy/index.tsx'));
                        

                            //import Settings_Ci_Cd_Release_Config_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/release_config/index.js'
                            const Settings_Ci_Cd_Release_Config_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/release_config/index.tsx'));
                        

                            //import Settings_Ci_Cd_Release_Config_Namespace_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/release_config/[namespace]/index.js'
                            const Settings_Ci_Cd_Release_Config_Namespace_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/release_config/[namespace]/index.tsx'));
                        

                            //import Settings_Ci_Cd_Release_Config_Namespace_Config_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/release_config/[namespace]/[config_name]/index.js'
                            const Settings_Ci_Cd_Release_Config_Namespace_Config_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/release_config/[namespace]/[config_name]/index.tsx'));
                        

                            //import Settings_Ci_Cd_Source_Control_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/source_control/index.js'
                            const Settings_Ci_Cd_Source_Control_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/source_control/index.tsx'));
                        

                            //import Settings_Ci_Cd_Source_Control_Repo_Id_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/source_control/[repo_id]/index.js'
                            const Settings_Ci_Cd_Source_Control_Repo_Id_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/source_control/[repo_id]/index.tsx'));
                        

                            //import Settings_Ci_Cd_Source_Control_Repo_Id_Branch_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/ci_cd/source_control/[repo_id]/[branch_name]/index.js'
                            const Settings_Ci_Cd_Source_Control_Repo_Id_Branch_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/ci_cd/source_control/[repo_id]/[branch_name]/index.tsx'));
                        

                            //import Settings_Charts_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/charts/index.js'
                            const Settings_Charts_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/charts/index.tsx'));
                        

                            //import Settings_Gcp_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/index.js'
                            const Settings_Gcp_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/index.tsx'));
                        

                            //import Settings_Gcp_Layout from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/layout.js'
                            const Settings_Gcp_Layout = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/layout.tsx'));
                        

                            //import Settings_Gcp_Storage_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/index.js'
                            const Settings_Gcp_Storage_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Buckets_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/buckets/index.js'
                            const Settings_Gcp_Storage_Buckets_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/buckets/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Buckets_Id_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/buckets/[id]/index.js'
                            const Settings_Gcp_Storage_Buckets_Id_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/buckets/[id]/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Filestores_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/filestores/index.js'
                            const Settings_Gcp_Storage_Filestores_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/filestores/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Filestores_Id_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/filestores/[id]/index.js'
                            const Settings_Gcp_Storage_Filestores_Id_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/filestores/[id]/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Disks_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/disks/index.js'
                            const Settings_Gcp_Storage_Disks_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/disks/index.tsx'));
                        

                            //import Settings_Gcp_Storage_Disks_Id_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/storage/disks/[id]/index.js'
                            const Settings_Gcp_Storage_Disks_Id_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/storage/disks/[id]/index.tsx'));
                        

                            //import Settings_Gcp_Compute_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/compute/index.js'
                            const Settings_Gcp_Compute_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/compute/index.tsx'));
                        

                            //import Settings_Gcp_Compute_Instances_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/compute/instances/index.js'
                            const Settings_Gcp_Compute_Instances_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/compute/instances/index.tsx'));
                        

                            //import Settings_Gcp_Compute_Instances_Instance_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/gcp/compute/instances/[instance_name]/index.js'
                            const Settings_Gcp_Compute_Instances_Instance_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/gcp/compute/instances/[instance_name]/index.tsx'));
                        

                            //import Settings_Kubernetes_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/index.js'
                            const Settings_Kubernetes_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/index.tsx'));
                        

                            //import Settings_Kubernetes_Rbac_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/rbac/index.js'
                            const Settings_Kubernetes_Rbac_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/rbac/index.tsx'));
                        

                            //import Settings_Kubernetes_Contexts_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/contexts/index.js'
                            const Settings_Kubernetes_Contexts_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/contexts/index.tsx'));
                        

                            //import Settings_Kubernetes_Namespaces_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/namespaces/index.js'
                            const Settings_Kubernetes_Namespaces_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/namespaces/index.tsx'));
                        

                            //import Settings_Kubernetes_Configs_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/configs/index.js'
                            const Settings_Kubernetes_Configs_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/configs/index.tsx'));
                        

                            //import Settings_Kubernetes_Resource_Quota_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/kubernetes/resource-quota/index.js'
                            const Settings_Kubernetes_Resource_Quota_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/kubernetes/resource-quota/index.tsx'));
                        

                            //import Settings_Credentials_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/settings/credentials/index.js'
                            const Settings_Credentials_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/settings/credentials/index.tsx'));
                        

                            //import Infra_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/infra/index.js'
                            const Infra_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/infra/index.tsx'));
                        

                            //import Infra_Layout from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/infra/layout.js'
                            const Infra_Layout = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/infra/layout.tsx'));
                        

                            //import Infra_Manager_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/infra/manager/index.js'
                            const Infra_Manager_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/infra/manager/index.tsx'));
                        

                            //import Bastion_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/index.js'
                            const Bastion_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/index.tsx'));
                        

                            //import Bastion_Layout from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/layout.js'
                            const Bastion_Layout = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/layout.tsx'));
                        

                            //import Bastion_Audit_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/audit/index.js'
                            const Bastion_Audit_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/audit/index.tsx'));
                        

                            //import Bastion_Keys_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/keys/index.js'
                            const Bastion_Keys_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/keys/index.tsx'));
                        

                            //import Bastion_Systems_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/systems/index.js'
                            const Bastion_Systems_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/systems/index.tsx'));
                        

                            //import Bastion_Console_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/bastion/console/index.js'
                            const Bastion_Console_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/bastion/console/index.tsx'));
                        

                            //import Addons_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/addons/index.js'
                            const Addons_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/addons/index.tsx'));
                        

                            //import Addons_Essentials_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/addons/essentials/index.js'
                            const Addons_Essentials_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/addons/essentials/index.tsx'));
                        

                            //import Compute_Instance_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/compute/[instance_name]/index.js'
                            const Compute_Instance_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/compute/[instance_name]/index.tsx'));
                        

                            //import Orchestration_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/index.js'
                            const Orchestration_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/index.tsx'));
                        

                            //import Orchestration_Swarms_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/swarms/index.js'
                            const Orchestration_Swarms_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/swarms/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/index.js'
                            const Orchestration_Kubernetes_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/index.js'
                            const Orchestration_Kubernetes_Namespace_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Flowv2_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/flowV2/index.js'
                            const Orchestration_Kubernetes_Namespace_Flowv2_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/flowV2/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Configmaps_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/configmaps/index.js'
                            const Orchestration_Kubernetes_Namespace_Configmaps_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/configmaps/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Configmaps_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/configmaps/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Configmaps_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/configmaps/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Certificate_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/certificate/index.js'
                            const Orchestration_Kubernetes_Namespace_Certificate_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/certificate/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Secrets_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/secrets/index.js'
                            const Orchestration_Kubernetes_Namespace_Secrets_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/secrets/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Secrets_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/secrets/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Secrets_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/secrets/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Resources_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/resources/index.js'
                            const Orchestration_Kubernetes_Namespace_Resources_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/resources/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Resources_Resourcetype_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/resources/[resourceType]/index.js'
                            const Orchestration_Kubernetes_Namespace_Resources_Resourcetype_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/resources/[resourceType]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Namespace_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/namespace/index.js'
                            const Orchestration_Kubernetes_Namespace_Namespace_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/namespace/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Ingresses_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/ingresses/index.js'
                            const Orchestration_Kubernetes_Namespace_Ingresses_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/ingresses/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Ingresses_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/ingresses/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Ingresses_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/ingresses/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Pods_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/pods/index.js'
                            const Orchestration_Kubernetes_Namespace_Pods_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/pods/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Pods_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/pods/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Pods_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/pods/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Issuers_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/issuers/index.js'
                            const Orchestration_Kubernetes_Namespace_Issuers_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/issuers/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Services_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/services/index.js'
                            const Orchestration_Kubernetes_Namespace_Services_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/services/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Services_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/services/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Services_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/services/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Issuer_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/issuer/index.js'
                            const Orchestration_Kubernetes_Namespace_Issuer_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/issuer/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Deployments_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/deployments/index.js'
                            const Orchestration_Kubernetes_Namespace_Deployments_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/deployments/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Deployments_Type_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/deployments/[type]/index.js'
                            const Orchestration_Kubernetes_Namespace_Deployments_Type_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/deployments/[type]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Deployments_Type_Name_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/deployments/[type]/[name]/index.js'
                            const Orchestration_Kubernetes_Namespace_Deployments_Type_Name_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/deployments/[type]/[name]/index.tsx'));
                        

                            //import Orchestration_Kubernetes_Namespace_Flow_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/orchestration/kubernetes/[namespace]/flow/index.js'
                            const Orchestration_Kubernetes_Namespace_Flow_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/orchestration/kubernetes/[namespace]/flow/index.tsx'));
                        

                            //import Queues_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/queues/index.js'
                            const Queues_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/queues/index.tsx'));
                        

                            //import Login_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/login/index.js'
                            const Login_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/login/index.tsx'));
                        

                            //import Cee_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/index.js'
                            const Cee_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/index.tsx'));
                        

                            //import Cee_Docker_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/index.js'
                            const Cee_Docker_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/index.tsx'));
                        

                            //import Cee_Docker_Storages_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/storages/index.js'
                            const Cee_Docker_Storages_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/storages/index.tsx'));
                        

                            //import Cee_Docker_Network_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/network/index.js'
                            const Cee_Docker_Network_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/network/index.tsx'));
                        

                            //import Cee_Docker_Container_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/container/index.js'
                            const Cee_Docker_Container_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/container/index.tsx'));
                        

                            //import Cee_Docker_Packages_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/packages/index.js'
                            const Cee_Docker_Packages_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/packages/index.tsx'));
                        

                            //import Cee_Docker_Packages_Id_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/packages/[id]/index.js'
                            const Cee_Docker_Packages_Id_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/packages/[id]/index.tsx'));
                        

                            //import Cee_Docker_Hub_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/cee/docker/hub/index.js'
                            const Cee_Docker_Hub_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/cee/docker/hub/index.tsx'));
                        

                            //import Onboarding_Index from '/Users/deep/Projects/py-react/cloud_ops/_kiwijs/build/app/onboarding/index.js'
                            const Onboarding_Index = React.lazy(() => import('/Users/deep/Projects/py-react/cloud_ops/src/app/onboarding/index.tsx'));
                        
const DefaultLoader_ = ({isLoading}) => {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(isLoading);
    useEffect(() => {
        let interval;
        if (isLoading) {
            startTransition(()=>{
                setLoading(true);
                setProgress(0);
            })
            let startTime = Date.now();

            interval = setInterval(() => {
                startTransition(()=>{
                    setProgress((prev) => {
                        // Calculate elapsed time
                        const elapsedTime = Date.now() - startTime;
                        let speedFactor = 1;
    
                        // Change speed depending on how long the loader has been active
                        if (elapsedTime < 2000) {
                            // Accelerate in the first 2 seconds
                            speedFactor = 1 + Math.sin(elapsedTime / 1000) * 0.8; // Sinusoidal speed change
                        } else if (elapsedTime < 4000) {
                            // Slow down after 2 seconds
                            speedFactor = 1 - Math.sin(elapsedTime / 2000) * 0.8; // Decelerating pattern
                        }
    
                        // Prevent the progress from exceeding 100%
                        let newProgress = prev + (speedFactor * 0.8); // Adjust increment dynamically
    
                        if (newProgress >= 100) {
                            newProgress = 99; // Cap progress at 100%
                        }
                        return newProgress;
                    });
                })
            }, 50); // Interval duration can stay constant

        } else {
            // Ensure progress is completed when stopping
            startTransition(()=>{
                setProgress(99);
            })
            setTimeout(() => setLoading(false), 300); // Brief delay before setting loading to false
        }

        return () => {
            clearInterval(interval);
        };
    }, [isLoading]);

    if (!loading) return null;
    return (
        <div className="custom-backdrop">
            <div className="custom-progress-bar" style={{ width: `${{progress}}%` }}></div>
        </div>
    );
};


const PropsProvider = ({Element,Fallback,...props})=>{
    const location = useLocation()
    const [loading,setLoading] = useState(false)

    const [propsData,setPropData] = useState(()=>(()=>{
        try {
            const data = JSON.parse(JSON.stringify(window.fastApi_react_app_props))
            return data
        }catch(err){
            return props
        }
    })())

    useEffect(()=>{
        React.startTransition(()=>{
            const data  = JSON.parse(JSON.stringify(window.fastApi_react_app_props))
            setPropData(data)
            setLoading(false)
        })
        return ()=>{
            setLoading(false)
        }
    },[location])

    useEffect(() => {
        // Define a function to update the loading state
        const handleLoadingEvent = (event) => {
            React.startTransition(()=>{
                setLoading(event.detail);  // Update state based on the event's detail
            })
        };

        // Listen for the custom event on the window object
        window.addEventListener('loadingEvent', handleLoadingEvent);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('loadingEvent', handleLoadingEvent);
        };
    }, []);

    return (
        <Suspense fallback={<Fallback isLoading={true} />}>
            <Element {...propsData} />
            <Fallback isLoading={loading} />
        </Suspense>
    )
}

const LayoutPropsProvider = ({Element,Fallback , forUrl, ...props})=>{
    const location = useLocation();
    const [propsData,setPropsData] = useState((()=>{
        try {
            const data = JSON.parse(JSON.stringify(window.fastApi_react_app_props))
            if ("layout_props" in data){
                Object.keys(data.layout_props).map(key=>{
                    if (location.pathname.includes(key.endsWith("/") ?
                        key.substr(0,key.length-1):key) && matchPath({ path: location.pathname, exact: true },forUrl)){
                        startTransition(()=>{
                            setPropsData({...data.layout_props[key],location:props.location})
                        })
                    }
                })
            }
            return data
        }catch(err){
            if ("layout_props" in props) {
                const layouts = Object.keys(props.layout_props).filter((key) => {
                    if (location.pathname.includes(key.endsWith("/")?key.substr(0,key.length-1):key)) {
                        return { ...props.layout_props[key], location: props.location };
                    }
                });
                let currentLayoutProp = undefined
                for(let i=0;i<layouts.length;i++){
                    if(matchPath({ path: layouts[i], exact: true },forUrl)){
                        currentLayoutProp = props.layout_props[layouts[i]]
                        break
                    }
                }
                if(currentLayoutProp){
                    return currentLayoutProp
                }else{
                    return props;
                }
            } else {
                return props;
            }
        }
    })())

    useEffect(()=>{
        const data  = JSON.parse(JSON.stringify(window.fastApi_react_app_props))
        if ("layout_props" in data){
            Object.keys(data.layout_props).map(key=>{
                if (location.pathname.includes(key.endsWith("/")?key.substr(0,key.length-1):key) && matchPath({ path: location.pathname, exact: true },forUrl)){
                    startTransition(()=>{
                        setPropsData({...data.layout_props[key],location:props.location})
                    })
                }
            })
        }
    },[location])
    
    return (
        <Suspense fallback={<Fallback isLoading={true} />}>
            <Element {...propsData} />
        </Suspense>
    )
}
const GenericNotFound = () => {
    return (
        <div style={{
            height:"100vh",
        }} className="flex items-center justify-center bg-white dark:bg-gray-950 px-4 md:px-6">
            <div className="max-w-md text-center space-y-4">
                <h1 style={{fontSize: "8rem", lineHeight: "1", color: "rgb(17 24 39)"}} 
                    className="font-bold text-gray-900 dark:text-gray-50"
                >
                    404
                </h1>
                <p style={{fontSize: "1.125rem",color: "rgb(107 114 128)"}} className="dark:text-gray-400">
                    Oops, the page you are looking for could not be found.
                </p>
            </div>
        </div>
    )
}
const Error = ({ hasError, error, ...props }) => {
  const parseErrorMessage = (data) => {
    const msgStartIndex = data.indexOf('data-msg="') + 'data-msg="'.length;
    const msgEndIndex = data.indexOf('"', msgStartIndex);
    const msg = data
      .substring(msgStartIndex, msgEndIndex)
      .replace(/&quot;/g, '"');

    const stackStartIndex = data.indexOf('data-stck="') + 'data-stck="'.length;
    const stackEndIndex = data.indexOf('"', stackStartIndex);
    const stack = data
      .substring(stackStartIndex, stackEndIndex)
      .replace(/\\n/g, "\\n");
    console.error(msg, stack);
    return { msg, stack };
  };

  if (hasError) {
    const { msg, stack } = parseErrorMessage(error);
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg p-8 max-w-screen-2xl w-full">
          <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
          <p className="mb-4 text-gray-800">{msg}</p>
          <pre className="bg-red-100 p-4 rounded overflow-x-auto text-red-700">
            {stack}
          </pre>
        </div>
      </div>
    );
  } else {
    return <>{props.children}</>;
  }
};

const DefaultLayout_ = ()=><Outlet/>
const App = (props) => (

            <Error {...props} >
        
<Routes>

                    <Route path="*" 
                        element = {
                            <LayoutPropsProvider key={"/"} Fallback={DefaultLoader_} forUrl={"/"} Element={Layout} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="settings" 
                        element = {
                            <LayoutPropsProvider key={"/settings/"} Fallback={DefaultLoader_} forUrl={"/settings/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="docker" 
                        element = {
                            <LayoutPropsProvider key={"/settings/docker/"} Fallback={DefaultLoader_} forUrl={"/settings/docker/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Docker_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="config" 
                        element = {
                            <LayoutPropsProvider key={"/settings/docker/config/"} Fallback={DefaultLoader_} forUrl={"/settings/docker/config/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Docker_Config_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="registry" 
                        element = {
                            <LayoutPropsProvider key={"/settings/docker/registry/"} Fallback={DefaultLoader_} forUrl={"/settings/docker/registry/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Docker_Registry_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":image" 
                        element = {
                            <LayoutPropsProvider key={"/settings/docker/registry/:image/"} Fallback={DefaultLoader_} forUrl={"/settings/docker/registry/:image/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Docker_Registry_Image_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":tag" 
                        element = {
                            <LayoutPropsProvider key={"/settings/docker/registry/:image/:tag/"} Fallback={DefaultLoader_} forUrl={"/settings/docker/registry/:image/:tag/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Docker_Registry_Image_Tag_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="ci_cd" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="release_strategies" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/release_strategies/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/release_strategies/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Release_Strategies_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="library" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/library/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/library/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Library_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":templateName" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/library/:templateName/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/library/:templateName/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Library_Templatename_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="release_control" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/release_control/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/release_control/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Release_Control_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="deployment_strategy" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/deployment_strategy/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/deployment_strategy/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Deployment_Strategy_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="release_config" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/release_config/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/release_config/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Release_Config_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":namespace" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/release_config/:namespace/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/release_config/:namespace/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Release_Config_Namespace_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":config_name" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/release_config/:namespace/:config_name/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/release_config/:namespace/:config_name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Release_Config_Namespace_Config_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="source_control" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/source_control/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/source_control/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Source_Control_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":repo_id" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/source_control/:repo_id/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/source_control/:repo_id/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Source_Control_Repo_Id_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":branch_name" 
                        element = {
                            <LayoutPropsProvider key={"/settings/ci_cd/source_control/:repo_id/:branch_name/"} Fallback={DefaultLoader_} forUrl={"/settings/ci_cd/source_control/:repo_id/:branch_name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Ci_Cd_Source_Control_Repo_Id_Branch_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="charts" 
                        element = {
                            <LayoutPropsProvider key={"/settings/charts/"} Fallback={DefaultLoader_} forUrl={"/settings/charts/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Charts_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="gcp" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/"} Element={Settings_Gcp_Layout} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="storage" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="buckets" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/buckets/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/buckets/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Buckets_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":id" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/buckets/:id/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/buckets/:id/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Buckets_Id_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="filestores" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/filestores/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/filestores/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Filestores_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":id" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/filestores/:id/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/filestores/:id/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Filestores_Id_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="disks" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/disks/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/disks/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Disks_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":id" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/storage/disks/:id/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/storage/disks/:id/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Storage_Disks_Id_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="compute" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/compute/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/compute/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Compute_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="instances" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/compute/instances/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/compute/instances/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Compute_Instances_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":instance_name" 
                        element = {
                            <LayoutPropsProvider key={"/settings/gcp/compute/instances/:instance_name/"} Fallback={DefaultLoader_} forUrl={"/settings/gcp/compute/instances/:instance_name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Gcp_Compute_Instances_Instance_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="kubernetes" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="rbac" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/rbac/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/rbac/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Rbac_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="contexts" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/contexts/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/contexts/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Contexts_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="namespaces" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/namespaces/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/namespaces/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Namespaces_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="configs" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/configs/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/configs/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Configs_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="resource-quota" 
                        element = {
                            <LayoutPropsProvider key={"/settings/kubernetes/resource-quota/"} Fallback={DefaultLoader_} forUrl={"/settings/kubernetes/resource-quota/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Kubernetes_Resource_Quota_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="credentials" 
                        element = {
                            <LayoutPropsProvider key={"/settings/credentials/"} Fallback={DefaultLoader_} forUrl={"/settings/credentials/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Settings_Credentials_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="infra" 
                        element = {
                            <LayoutPropsProvider key={"/infra/"} Fallback={DefaultLoader_} forUrl={"/infra/"} Element={Infra_Layout} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Infra_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="manager" 
                        element = {
                            <LayoutPropsProvider key={"/infra/manager/"} Fallback={DefaultLoader_} forUrl={"/infra/manager/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Infra_Manager_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="bastion" 
                        element = {
                            <LayoutPropsProvider key={"/bastion/"} Fallback={DefaultLoader_} forUrl={"/bastion/"} Element={Bastion_Layout} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Bastion_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="audit" 
                        element = {
                            <LayoutPropsProvider key={"/bastion/audit/"} Fallback={DefaultLoader_} forUrl={"/bastion/audit/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Bastion_Audit_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="keys" 
                        element = {
                            <LayoutPropsProvider key={"/bastion/keys/"} Fallback={DefaultLoader_} forUrl={"/bastion/keys/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Bastion_Keys_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="systems" 
                        element = {
                            <LayoutPropsProvider key={"/bastion/systems/"} Fallback={DefaultLoader_} forUrl={"/bastion/systems/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Bastion_Systems_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="console" 
                        element = {
                            <LayoutPropsProvider key={"/bastion/console/"} Fallback={DefaultLoader_} forUrl={"/bastion/console/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Bastion_Console_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="addons" 
                        element = {
                            <LayoutPropsProvider key={"/addons/"} Fallback={DefaultLoader_} forUrl={"/addons/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Addons_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="essentials" 
                        element = {
                            <LayoutPropsProvider key={"/addons/essentials/"} Fallback={DefaultLoader_} forUrl={"/addons/essentials/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Addons_Essentials_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="orchestration" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/"} Fallback={DefaultLoader_} forUrl={"/orchestration/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="swarms" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/swarms/"} Fallback={DefaultLoader_} forUrl={"/orchestration/swarms/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Swarms_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="kubernetes" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":namespace" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="flowV2" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/flowV2/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/flowV2/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Flowv2_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="configmaps" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/configmaps/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/configmaps/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Configmaps_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/configmaps/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/configmaps/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Configmaps_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="certificate" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/certificate/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/certificate/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Certificate_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="secrets" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/secrets/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/secrets/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Secrets_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/secrets/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/secrets/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Secrets_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="resources" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/resources/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/resources/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Resources_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":resourceType" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/resources/:resourceType/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/resources/:resourceType/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Resources_Resourcetype_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="namespace" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/namespace/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/namespace/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Namespace_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="ingresses" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/ingresses/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/ingresses/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Ingresses_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/ingresses/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/ingresses/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Ingresses_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="pods" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/pods/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/pods/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Pods_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/pods/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/pods/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Pods_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="issuers" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/issuers/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/issuers/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Issuers_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="services" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/services/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/services/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Services_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/services/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/services/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Services_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="issuer" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/issuer/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/issuer/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Issuer_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="deployments" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/deployments/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/deployments/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Deployments_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":type" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/deployments/:type/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/deployments/:type/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Deployments_Type_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":name" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/deployments/:type/:name/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/deployments/:type/:name/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Deployments_Type_Name_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="flow" 
                        element = {
                            <LayoutPropsProvider key={"/orchestration/kubernetes/:namespace/flow/"} Fallback={DefaultLoader_} forUrl={"/orchestration/kubernetes/:namespace/flow/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Orchestration_Kubernetes_Namespace_Flow_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="queues" 
                        element = {
                            <LayoutPropsProvider key={"/queues/"} Fallback={DefaultLoader_} forUrl={"/queues/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Queues_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="login" 
                        element = {
                            <LayoutPropsProvider key={"/login/"} Fallback={DefaultLoader_} forUrl={"/login/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Login_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="cee" 
                        element = {
                            <LayoutPropsProvider key={"/cee/"} Fallback={DefaultLoader_} forUrl={"/cee/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="docker" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path="storages" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/storages/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/storages/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Storages_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="network" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/network/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/network/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Network_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="container" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/container/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/container/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Container_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="packages" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/packages/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/packages/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Packages_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    

                    <Route path=":id" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/packages/:id/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/packages/:id/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Packages_Id_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="hub" 
                        element = {
                            <LayoutPropsProvider key={"/cee/docker/hub/"} Fallback={DefaultLoader_} forUrl={"/cee/docker/hub/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Cee_Docker_Hub_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>

                    <Route path="onboarding" 
                        element = {
                            <LayoutPropsProvider key={"/onboarding/"} Fallback={DefaultLoader_} forUrl={"/onboarding/"} Element={DefaultLayout_} {...props}/>
                        }
                    >
            

                        <Route index
                            element={
                                <PropsProvider Element={Onboarding_Index} Fallback={DefaultLoader_} {...props} />
                            }
                        />
                    
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Route>
<Route path="*" element={<GenericNotFound />}/>
</Routes>

            </Error>
        
)
export default App