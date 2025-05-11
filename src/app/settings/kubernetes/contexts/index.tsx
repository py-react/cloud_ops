

import React, {useContext} from 'react'
import Contexts from '@/components/kubernetes/settings/dashboard'
import type { KubernetesContext, KubernetesConfig } from "./types";
import { KubeContext } from "@/components/kubernetes/context/KubeContext";

function KubernetesSettings() {
    const {
      isLoading: isKubeContextLoading,
      config: kubeConfig,
      setCurrentKubeContext,
    } = useContext
    (KubeContext);
    if(isKubeContextLoading) return "Loading..."
  return <Contexts />;
}

export default KubernetesSettings