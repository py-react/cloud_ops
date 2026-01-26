from typing import Dict, Any, List
from sqlmodel import Session, select
from kubernetes import client
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile

class DeploymentGenerator:
    def __init__(self, session: Session):
        self.session = session

    def generate(self, deployment_id: int) -> Dict[str, Any]:
        """
        Generates a Kubernetes Deployment YAML (dict) from the database models.
        """
        deployment = self.session.get(DeploymentConfig, deployment_id)
        if not deployment:
            raise ValueError(f"DeploymentConfig with ID {deployment_id} not found")

        # 1. Metadata
        metadata = client.V1ObjectMeta(
            name=deployment.deployment_name,
            namespace=deployment.namespace,
            labels=deployment.labels or {},
            annotations=deployment.annotations or {}
        )

        # 2. Pod Spec Construction
        pod_spec = self._build_pod_spec(deployment)

        # 3. Pod Template
        # Ensure 'app' label exists for selector match
        labels = deployment.labels.copy() if deployment.labels else {}
        labels.setdefault("app", deployment.deployment_name)

        template = client.V1PodTemplateSpec(
            metadata=client.V1ObjectMeta(
                labels=labels
            ),
            spec=pod_spec
        )

        # 4. Deployment Spec
        spec = client.V1DeploymentSpec(
            replicas=deployment.replicas,
            selector=client.V1LabelSelector(
                match_labels={"app": deployment.deployment_name}
            ),
            template=template
        )
        
        # 5. Full Object
        deployment_obj = client.V1Deployment(
            api_version="apps/v1",
            kind="Deployment",
            metadata=metadata,
            spec=spec
        )

        return client.ApiClient().sanitize_for_serialization(deployment_obj)

    def _build_pod_spec(self, deployment: DeploymentConfig):
        pass
        # containers = []
        # volumes = []

        # # Process Containers
        # for container_profile in deployment.containers:
        #     containers.append(self._build_container(container_profile))

        # # Process Volumes
        # for volume_profile in deployment.volumes:
        #     volumes.append(self._build_volume(volume_profile))

        # # Process Scheduling (Affinity, NodeSelector, Tolerations)
        # node_selector = None
        # affinity = None
        # tolerations = None
        
        # if deployment.scheduling_profile:
        #     sched = deployment.scheduling_profile
        #     node_selector = sched.node_selector
        #     if sched.affinity:
        #         # Assuming affinity is stored as a valid K8s dict structure in JSONB
        #         affinity = sched.affinity 
        #     if sched.tolerations:
        #         tolerations = sched.tolerations

        # return client.V1PodSpec(
        #     containers=containers,
        #     volumes=volumes,
        #     node_selector=node_selector,
        #     affinity=affinity,
        #     tolerations=tolerations
        # )

    def _build_container(self, profile: K8sContainerProfile) :
        pass
        # Resolve Resources
        # resources = None
        # if profile.resources_profile_id:
        #     res_profile = self.session.get(K8sResourceProfile, profile.resources_profile_id)
        #     if res_profile:
        #         resources = client.V1ResourceRequirements(
        #             requests=res_profile.requests,
        #             limits=res_profile.limits
        #         )

        # # Resolve Probes
        # liveness_probe = self._build_probe(profile.liveness_probe_id)
        # readiness_probe = self._build_probe(profile.readiness_probe_id)
        # startup_probe = self._build_probe(profile.startup_probe_id)

        # # Resolve Lifecycle
        # lifecycle = None
        # if profile.lifecycle_profile_id:
        #     lc_profile = self.session.get(K8sLifecycleProfile, profile.lifecycle_profile_id)
        #     if lc_profile:
        #         lifecycle = client.V1Lifecycle(**lc_profile.lifecycle_config)

        # # Resolve Env Vars
        # env = [] 
        # # Manually query the link table since it's defined but relationship might not be auto-loaded
        # # Depends on if 'env_profiles' relationship exists. Checking container.py snippet...
        # # It had K8sContainerEnv defined but no explicit relationship on K8sContainerProfile.
        # # So we query manually.
        
        # stmt = select(K8sEnvProfile).join(K8sContainerEnv).where(K8sContainerEnv.container_profile_id == profile.id)
        # env_profiles = self.session.exec(stmt).all()
        
        # for env_prof in env_profiles:
        #     # K8sEnvProfile has 'data' which is Dict[str, str]
        #     if env_prof.data:
        #         for k, v in env_prof.data.items():
        #             env.append(client.V1EnvVar(name=k, value=str(v)))

        # return client.V1Container(
        #     name=profile.container_name,
        #     image=profile.image,
        #     image_pull_policy=profile.image_pull_policy,
        #     command=profile.command,
        #     args=profile.args,
        #     working_dir=profile.working_dir,
        #     resources=resources,
        #     liveness_probe=liveness_probe,
        #     readiness_probe=readiness_probe,
        #     startup_probe=startup_probe,
        #     lifecycle=lifecycle,
        #     env=env,
        #     volume_mounts=profile.volume_mounts, # Assuming List[V1VolumeMount] dicts
        #     ports=profile.ports # Assuming List[V1ContainerPort] dicts
        # )

    def _build_probe(self, probe_id: int) -> Any:
        pass
        # if not probe_id:
        #     return None
        # probe_profile = self.session.get(K8sProbeProfile, probe_id)
        # if not probe_profile:
        #     return None
        
        # # Convert camelCase keys to snake_case for K8s Python client
        # safe_config = {self._to_snake_case(k): v for k, v in probe_profile.probe_config.items()}
        # return client.V1Probe(**safe_config)

    def _build_volume(self, profile ) :
        pass
        # # Convert camelCase keys to snake_case for K8s Python client
        # safe_config = {self._to_snake_case(k): v for k, v in profile.volume_config.items()}
        # return client.V1Volume(
        #     name=profile.volume_name,
        #     **safe_config
        # )

    def _to_snake_case(self, name: str) -> str:
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
