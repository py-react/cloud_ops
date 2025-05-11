export interface KubernetesContext {
    context: {
      cluster: string;
      user: string;
      namespace: string;

    };
    name: string;
  }
  
  export interface KubernetesConfig {
    contexts: KubernetesContext[];
    current_context: KubernetesContext;
  }