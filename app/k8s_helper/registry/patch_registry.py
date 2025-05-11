from .types import SetReplicas, SetContainerImage, SetLabels, SetAnnotations, RemoveEnvVars, SetResources, AddVolume, RemoveVolume, AddEnvVars, AddPort, RemovePort, SetStrategy, SetNodeSelector, SetAffinity, SetTolerations, AddInitContainer, AddSidecarContainer, RemoveInitContainer, RemoveSidecarContainer, UpdateConfigMapData, UpdateSecretData, SetServiceType, SetServicePorts, SetStorageClass

supported_mapping_types = {
    "set_replicas": ["Deployment", "StatefulSet", "ReplicaSet"],
    "set_container_image": ["Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"],
    "set_labels": ["Deployment", "StatefulSet", "ReplicaSet", "Pod", "Service", "ConfigMap", "Secret", "PersistentVolumeClaim"],
    "set_annotations": ["Deployment", "StatefulSet", "ReplicaSet", "Pod", "Service", "ConfigMap", "Secret", "PersistentVolumeClaim"],
    "remove_env_vars": ["Deployment", "StatefulSet", "DaemonSet", "Job"],
    "set_resources": ["Deployment", "StatefulSet", "DaemonSet", "Job"],
    "add_volume": ["Deployment", "StatefulSet", "DaemonSet"],
    "remove_volume": ["Deployment", "StatefulSet", "DaemonSet"],
    "add_env_vars": ["Deployment", "StatefulSet", "DaemonSet", "Job"],
    "add_port": ["Deployment", "StatefulSet", "DaemonSet"],
    "remove_port": ["Deployment", "StatefulSet", "DaemonSet"],
    "set_strategy": ["Deployment", "StatefulSet"],
    "set_node_selector": ["Deployment", "StatefulSet", "DaemonSet", "Pod"],
    "set_affinity": ["Deployment", "StatefulSet", "DaemonSet", "Pod"],
    "set_tolerations": ["Deployment", "StatefulSet", "DaemonSet", "Pod"],
    "add_init_container": ["Deployment", "StatefulSet", "DaemonSet"],
    "add_sidecar_container": ["Deployment", "StatefulSet", "DaemonSet"],
    "remove_init_container": ["Deployment", "StatefulSet", "DaemonSet"],
    "remove_sidecar_container": ["Deployment", "StatefulSet", "DaemonSet"],
    "update_configmap_data": ["ConfigMap"],
    "update_secret_data": ["Secret"],
    "set_service_type": ["Service"],
    "set_service_ports": ["Service"],
    "set_storage_class": ["PersistentVolumeClaim"],
}

class PatchRegistry:
  def __init__(self, params):
    self.name = "PATCH REGISTRY"

  def set_replicas(self,data: SetReplicas):
      def modify(resource: dict):
          resource.setdefault("spec", {})["replicas"] = data['count']
          return resource
      return modify
    
  def set_container_image(self,data: SetContainerImage):
      def modify(resource: dict):
          containers = resource.get("spec", {}) \
                               .get("template", {}) \
                               .get("spec", {}) \
                               .get("containers", [])
          for c in containers:
              if c.get("name") == data["container_name"]:
                  c["image"] = data["new_image"]
          return resource
      return modify
  
  def set_labels(self,data: SetLabels):
      def modify(resource: dict):
          labels = resource.setdefault("metadata", {}) \
                           .setdefault("labels", {})
          labels.update(data["labels"])
          return resource
      return modify
  
  def set_annotations(self,data: SetAnnotations):
      def modify(resource: dict):
          ann = resource.setdefault("metadata", {}) \
                        .setdefault("annotations", {})
          ann.update(data["new_annotations"])
          return resource
      return modify
  
  def remove_env_vars(self,data: RemoveEnvVars):
      def modify(resource: dict):
          containers = resource.get("spec", {}) \
                               .get("template", {}) \
                               .get("spec", {}) \
                               .get("containers", [])
          for c in containers:
              if c.get("name") == data["container_name"]:
                  c["env"] = [e for e in c.get("env", []) if e["name"] not in data["var_names"]]
          return resource
      return modify
  
  def set_resources(self,data: SetResources):
      def modify(resource: dict):
          containers = resource.get("spec", {})\
                               .get("template", {})\
                               .get("spec", {})\
                               .get("containers", [])
          for c in containers:
              print(c,"here man")
              if c.get("name") == data["container_name"]:
                  res = c.get("resources", {})
                  if data.get("requests"):
                      res.get("requests", {}).update(data["requests"])
                  if data.get("limits"):
                      res.get("limits", {}).update(data["limits"])
          return resource
      return modify
  
  def add_volume(self,data: AddVolume):
      def modify(resource: dict):
          pod_spec = resource.get("spec", {})\
                             .get("template", {})\
                             .get("spec", {})
          volumes = pod_spec.get("volumes", [])
          volumes.append(data["volume"])
          pod_spec["volumes"] = volumes
          if data.get("mount"):
              for c in pod_spec.setdefault("containers", []):
                  if c.get("name") == data.get("mount").get("containerName"):
                      volume_mounts = c.get("volumeMounts", [])
                      volume_mounts.append(data["mount"])
                      c["volumeMounts"] = volume_mounts
          return resource
      return modify
  
  def remove_volume(self,data: RemoveVolume):
        def modify(resource: dict):
            pod_spec = resource.get("spec", {})\
                                .get("template", {})\
                                .get("spec", {})
            
            for c in pod_spec.get("containers", []):
                new_volume_mounts = []
                for m in c.get("volumeMounts", []):
                    if m.get("name") != data["volume_name"]:
                        new_volume_mounts.append(m)
                c["volumeMounts"] = new_volume_mounts

            volumes = pod_spec.get("volumes", [])
            new_volumes = []
            for v in volumes:
                if v.get("name") != data["volume_name"]:
                    new_volumes.append(v)
            pod_spec["volumes"] = new_volumes
            return resource
        return modify
  
  def add_env_vars(data: AddEnvVars):
      def modify(resource: dict):
          containers = resource.get("spec", {}) \
                               .get("template", {}) \
                               .get("spec", {}) \
                               .get("containers", [])
          for c in containers:
              if c.get("name") == data.container_name:
                  env_list = c.setdefault("env", [])
                  for k, v in data.env_vars.items():
                      env_list.append({"name": k, "value": v})
          return resource
      return modify
  
  def add_port(data: AddPort):
      def modify(resource: dict):
          for c in resource.setdefault("spec", {}) \
                           .setdefault("template", {}) \
                           .setdefault("spec", {}) \
                           .setdefault("containers", []):
              if c.get("name") == data.container_name:
                  c.setdefault("ports", []).append(data.port_spec)
          return resource
      return modify
  
  def remove_port(data: RemovePort):
      def modify(resource: dict):
          for c in resource.get("spec", {}) \
                           .get("template", {}) \
                           .get("spec", {}) \
                           .get("containers", []):
              if c.get("name") == data.container_name:
                  c["ports"] = [p for p in c.get("ports", []) if p.get("name") != data.port_name]
          return resource
      return modify
  
  def set_strategy(data: SetStrategy):
      def modify(resource: dict):
          resource.setdefault("spec", {})["strategy"] = data.strategy
          return resource
      return modify
  
  def set_node_selector(data: SetNodeSelector):
      def modify(resource: dict):
          spec = resource.setdefault("spec", {})\
                         .setdefault("template", {})\
                         .setdefault("spec", {})
          spec["nodeSelector"] = data.selector
          return resource
      return modify
  
  def set_affinity(data: SetAffinity):
      def modify(resource: dict):
          spec = resource.setdefault("spec", {})\
                         .setdefault("template", {})\
                         .setdefault("spec", {})
          spec["affinity"] = data.affinity
          return resource
      return modify
  
  def set_tolerations(data: SetTolerations):
      def modify(resource: dict):
          spec = resource.setdefault("spec", {})\
                         .setdefault("template", {})\
                         .setdefault("spec", {})
          spec["tolerations"] = data.tolerations
          return resource
      return modify
  
  def add_init_container(data: AddInitContainer):
      def modify(resource: dict):
          spec = resource.setdefault("spec", {})\
                         .setdefault("template", {})\
                         .setdefault("spec", {})
          spec.setdefault("initContainers", []).append(data.init)
          return resource
      return modify
  
  def add_sidecar_container(data: AddSidecarContainer):
      def modify(resource: dict):
          spec = resource.setdefault("spec", {})\
                         .setdefault("template", {})\
                         .setdefault("spec", {})
          spec.setdefault("containers", []).append(data.sidecar)
          return resource
      return modify
  
  def remove_init_container(data: RemoveInitContainer):
      def modify(resource: dict):
          spec = resource.get("spec", {})\
                         .get("template", {})\
                         .get("spec", {})
          spec["initContainers"] = [c for c in spec.get("initContainers", []) if c.get("name") != data.name]
          return resource
      return modify
  
  def remove_sidecar_container(data: RemoveSidecarContainer):
      def modify(resource: dict):
          spec = resource.get("spec", {})\
                         .get("template", {})\
                         .get("spec", {})
          spec["containers"] = [c for c in spec.get("containers", []) if c.get("name") != data.name]
          return resource
      return modify
  
  def update_configmap_data(self,data: UpdateConfigMapData):
      def modify(resource: dict):
          resource.setdefault("data", {}).update(data["new_data"])
          return resource
      return modify
  
  def update_secret_data(data: UpdateSecretData):
      def modify(resource: dict):
          resource.setdefault("data", {}).update(data.new_data)
          return resource
      return modify
  
  def set_service_type(data: SetServiceType):
      def modify(resource: dict):
          resource.setdefault("spec", {})["type"] = data.new_type
          return resource
      return modify
  
  def set_service_ports(data: SetServicePorts):
      def modify(resource: dict):
          resource.setdefault("spec", {})["ports"] = data.ports
          return resource
      return modify
  
  def set_storage_class(data: SetStorageClass):
      def modify(resource: dict):
          resource.setdefault("spec", {})["storageClassName"] = data.sc_name
          return resource
      return modify

