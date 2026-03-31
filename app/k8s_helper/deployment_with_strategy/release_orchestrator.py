import sys
import json
from typing import Dict, Any, List
from sqlmodel import Session
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute
from app.db_client.services.service_composer import ServiceComposer
from app.db_client.services.service_generator import ServiceGenerator
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from kubernetes import client

class ReleaseOrchestrator:
    def __init__(self, session: Session):
        self.session = session
        self.k8s_helper = KubernetesResourceHelper()

    def start_complex_release(self, config_obj: DeploymentConfig, run_data: Any, deployment_spec: Dict[str, Any], strategy_name: str) -> List[str]:
        """
        Orchestrates a Canary or Blue-Green release:
        1. Creates a specialized strategy Deployment with strictly isolated labels mapping.
        2. Creates a specialized strategy Service mapping directly to this isolated Deployment.
        3. Updates the HTTPRoute splitting traffic according to strategy defaults.
        """
        messages = []
        deployment_name = deployment_spec["metadata"]["name"]
        strategy_target_name = f"{deployment_name}-{strategy_name}"
        namespace = deployment_spec["metadata"]["namespace"]

        # 1. Create Strategy Deployment Spec
        strategy_deployment_spec = json.loads(json.dumps(deployment_spec)) # Deep copy
        strategy_deployment_spec["metadata"]["name"] = strategy_target_name
        
        # Ensure pod selection is fully isolated from the Stable deployment by redefining the 'app' label
        # This guarantees the Stable Service does not mistakenly sweep traffic to the new transient pods.
        strategy_deployment_spec["metadata"].setdefault("labels", {})["app"] = strategy_target_name
        strategy_deployment_spec["metadata"]["labels"]["release-role"] = strategy_name
        strategy_deployment_spec["metadata"]["labels"]["stable-name"] = deployment_name

        strategy_deployment_spec["spec"]["template"]["metadata"].setdefault("labels", {})["app"] = strategy_target_name
        strategy_deployment_spec["spec"]["template"]["metadata"]["labels"]["release-role"] = strategy_name
        strategy_deployment_spec["spec"]["template"]["metadata"]["labels"]["stable-name"] = deployment_name

        strategy_deployment_spec["spec"]["selector"] = {"matchLabels": {"app": strategy_target_name}}
        
        # Optionally reduce replicas for canary initially
        if strategy_name == "canary":
            strategy_deployment_spec["spec"]["replicas"] = 1

        # Apply strategy deployment
        sys.stderr.write(f"\n--- APPLYING {strategy_name.upper()} DEPLOYMENT: {strategy_target_name} ---\n")
        self.k8s_helper.apply_resource(strategy_deployment_spec)
        messages.append(f"{strategy_name.capitalize()} Deployment '{strategy_target_name}' created")

        # 2. Create Strategy Service
        strategy_service_name = f"{deployment_name}-{strategy_name}"
        service_port = 80 # default fallback
        
        if config_obj.service_id:
            service_obj = self.session.get(K8sService, config_obj.service_id)
            if service_obj:
                svc_composer = ServiceComposer(self.session)
                svc_data = svc_composer.compose(service_obj)
                
                if svc_data:
                    svc_generator = ServiceGenerator()
                    svc_spec = svc_generator.generate(svc_data)
                    
                    if svc_spec:
                        # Extract the dynamic port configured for the deployment
                        ports = svc_spec.get("spec", {}).get("ports", [])
                        if ports:
                            service_port = ports[0].get("port", 80)

                        # Modify service to rigidly route to isolated pods
                        svc_spec["metadata"]["name"] = strategy_service_name
                        svc_spec["spec"]["selector"] = {"app": strategy_target_name}
                        
                        sys.stderr.write(f"Applying {strategy_name.capitalize()} Service: {strategy_service_name}\n")
                        self.k8s_helper.apply_resource(svc_spec)
                        messages.append(f"{strategy_name.capitalize()} Service '{strategy_service_name}' created")

        # 3. Update HTTPRoute backendRefs
        http_route_id = getattr(run_data, "http_route_id", None) or config_obj.http_route_id
        if http_route_id:
            httproute_obj = self.session.get(K8sHTTPRoute, http_route_id)
            if httproute_obj:
                from src.app.api.integration.kubernetes.library.httproute.index import _build_httproute_manifest
                httproute_manifest = _build_httproute_manifest(self.session, httproute_obj)
                
                if httproute_manifest:
                    # Inject traffic splitting in the first rule
                    # Assuming a standard structure where we want to split between stable and canary services
                    stable_service_name = deployment_name # Default assumption
                    # Find existing service name from config if possible
                    if config_obj.service_id:
                         stable_service_obj = self.session.get(K8sService, config_obj.service_id)
                         if stable_service_obj:
                             stable_service_name = stable_service_obj.name

                    rules = httproute_manifest.get("spec", {}).get("rules", [])
                    if rules:
                        # Initial Traffic Defaults
                        # Blue-Green: Immediately route 0% stable to route traffic entirely to staging target (or keep 100/0 depending on use case. We mimic 100/0 default for safety.)
                        stable_weight = 100
                        strategy_weight = 0

                        rule = rules[0]
                        rule["backendRefs"] = [
                            {
                                "name": stable_service_name,
                                "port": service_port,
                                "weight": stable_weight
                            },
                            {
                                "name": strategy_service_name,
                                "port": service_port,
                                "weight": strategy_weight
                            }
                        ]
                        
                        sys.stderr.write(f"Applying Traffic Split to HTTPRoute: {httproute_manifest['metadata']['name']}\n")
                        self.k8s_helper.apply_resource(httproute_manifest)
                        messages.append(f"HTTPRoute updated with {stable_weight}/{strategy_weight} traffic split for {strategy_name}")

        return messages

    def list_active_releases(self, namespace: str) -> List[Dict[str, Any]]:
        """
        Lists deployments that are currently in a canary/blue-green state by querying labels.
        """
        releases = []
        try:
            # Look for canary/blue-green deployments
            deployments = self.k8s_helper.list_resources("apps/v1", "Deployment", namespace=namespace)
            if not deployments or not hasattr(deployments, 'items'):
                return releases
                
            for d in deployments.items:
                labels = d.metadata.labels or {}
                role = labels.get("release-role")
                if role in ["canary", "blue-green"]:
                    # Found a complex strategy deployment. Now find its stable counterpart.
                    stable_name = labels.get("stable-name") or d.metadata.name.replace(f"-{role}", "")
                    
                    # Try to find the HTTPRoute
                    http_routes = self.k8s_helper.list_resources("gateway.networking.k8s.io/v1", "HTTPRoute", namespace=namespace)
                    linked_route = None
                    stable_svc_name = None
                    weights = {}
                    
                    strategy_svc_name = f"{stable_name}-{role}"
                    
                    if http_routes and hasattr(http_routes, 'items'):
                        for route in http_routes.items:
                            route_dict = route.to_dict()
                            for rule in route_dict.get("spec", {}).get("rules", []):
                                for ref in rule.get("backendRefs", []):
                                    if ref.get("name") == strategy_svc_name:
                                        linked_route = route_dict.get("metadata", {}).get("name")
                                        # Collect weights for both stable and strategy route
                                        for r in rule.get("backendRefs", []):
                                            r_name = r.get("name")
                                            if r_name:
                                                weights[r_name] = r.get("weight", 0)
                                                if r_name != strategy_svc_name:
                                                    stable_svc_name = r_name
                                        break
                    
                    releases.append({
                        "name": stable_name,
                        "canary_name": d.metadata.name,
                        "namespace": namespace,
                        "strategy": role,
                        "status": "active",
                        "http_route": linked_route,
                        "weights": weights,
                        "stable_service_name": stable_svc_name or stable_name,
                        "strategy_service_name": strategy_svc_name
                    })
        except Exception as e:
            sys.stderr.write(f"Error listing active releases: {e}\n")
            
        return releases

    def update_weights(self, namespace: str, route_name: str, weights: Dict[str, int]) -> str:
        """
        Updates backendRef weights for an HTTPRoute.
        weights: { 'service-name': weight_value }
        """
        try:
            route = self.k8s_helper.get_resource("gateway.networking.k8s.io/v1", "HTTPRoute", route_name, namespace)
            if not route:
                return f"HTTPRoute '{route_name}' not found"

            # Modify the first rule's weights
            modified = False
            route_dict = route.to_dict()
            for rule in route_dict.get("spec", {}).get("rules", []):
                for ref in rule.get("backendRefs", []):
                    ref_name = ref.get("name")
                    if ref_name and ref_name in weights:
                        ref["weight"] = weights[ref_name]
                        modified = True
            
            if modified:
                self.k8s_helper.apply_resource(route_dict)
                return "Weights updated successfully"
            
            return "No matching backendRefs found in HTTPRoute"
        except Exception as e:
            return f"Error updating weights: {str(e)}"

    def promote_canary(self, deployment_name: str, namespace: str) -> str:
        """
        Promotes a complex release to stable:
        1. Updates stable deployment with the image from the temporary deployment.
        2. Deletes transient deployments and services (using label query to find active).
        3. Resets HTTPRoute traffic to stable.
        """
        try:
            # We attempt to find the active role for the given stable deployment.
            deployments = self.k8s_helper.list_resources("apps/v1", "Deployment", namespace=namespace)
            active_role = None
            if deployments and hasattr(deployments, 'items'):
                for d in deployments.items:
                    labels = d.metadata.labels or {}
                    role = labels.get("release-role")
                    stable = labels.get("stable-name") or d.metadata.name.replace(f"-{role}", "") if role else None
                    if role in ["canary", "blue-green"] and stable == deployment_name:
                        active_role = role
                        break
                    
            if not active_role:
                return f"No canary/blue-green active deployment for '{deployment_name}' found to promote"

            strategy_name = f"{deployment_name}-{active_role}"
            strategy_dep = self.k8s_helper.get_resource("apps/v1", "Deployment", strategy_name, namespace)

            # 1. Get image from strategy deployment
            strategy_image = strategy_dep.spec.template.spec.containers[0].image

            # 2. Update stable deployment
            stable_dep = self.k8s_helper.get_resource("apps/v1", "Deployment", deployment_name, namespace)
            if stable_dep:
                stable_dep.spec.template.spec.containers[0].image = strategy_image
                manifest = stable_dep.to_dict()
                self.k8s_helper.apply_resource(manifest)
                sys.stderr.write(f"Promoted stable deployment '{deployment_name}' to image '{strategy_image}'\n")

            # 3. Clean up Strategy resources
            self.k8s_helper.delete_resource({
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {"name": strategy_name, "namespace": namespace}
            })
            self.k8s_helper.delete_resource({
                "apiVersion": "v1",
                "kind": "Service",
                "metadata": {"name": strategy_name, "namespace": namespace}
            })

            # 4. Reset HTTPRoute
            http_routes = self.k8s_helper.list_resources("gateway.networking.k8s.io/v1", "HTTPRoute", namespace=namespace)
            if http_routes and hasattr(http_routes, 'items'):
                for route in http_routes.items:
                    modified = False
                    route_dict = route.to_dict()
                    for rule in route_dict.get("spec", {}).get("rules", []):
                        new_refs = []
                        for ref in rule.get("backendRefs", []):
                            ref_name = ref.get("name")
                            if ref_name == strategy_name:
                                modified = True
                                continue # Remove strategy ref
                            if ref_name == deployment_name:
                                ref["weight"] = 100
                                modified = True
                            new_refs.append(ref)
                        if modified:
                            rule["backendRefs"] = new_refs
                    
                    if modified:
                        self.k8s_helper.apply_resource(route_dict)

            return f"Release ({active_role}) promoted successfully"
        except Exception as e:
            return f"Error promoting release: {str(e)}"

    def rollback_canary(self, deployment_name: str, namespace: str) -> str:
        """
        Rolls back a complex active release:
        1. Deletes transient deployments and services.
        2. Resets HTTPRoute traffic entirely to stable.
        """
        try:
            deployments = self.k8s_helper.list_resources("apps/v1", "Deployment", namespace=namespace)
            active_role = None
            if deployments and hasattr(deployments, 'items'):
                for d in deployments.items:
                    labels = d.metadata.labels or {}
                    role = labels.get("release-role")
                    stable = labels.get("stable-name") or d.metadata.name.replace(f"-{role}", "") if role else None
                    if role in ["canary", "blue-green"] and stable == deployment_name:
                        active_role = role
                        break
                    
            if not active_role:
                return f"No active release found for '{deployment_name}' to rollback"

            strategy_name = f"{deployment_name}-{active_role}"
            
            # 1. Delete Strategy resources
            self.k8s_helper.delete_resource({
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {"name": strategy_name, "namespace": namespace}
            })
            self.k8s_helper.delete_resource({
                "apiVersion": "v1",
                "kind": "Service",
                "metadata": {"name": strategy_name, "namespace": namespace}
            })

            # 2. Reset HTTPRoute
            http_routes = self.k8s_helper.list_resources("gateway.networking.k8s.io/v1", "HTTPRoute", namespace=namespace)
            if http_routes and hasattr(http_routes, 'items'):
                for route in http_routes.items:
                    modified = False
                    route_dict = route.to_dict()
                    for rule in route_dict.get("spec", {}).get("rules", []):
                        new_refs = []
                        for ref in rule.get("backendRefs", []):
                            ref_name = ref.get("name")
                            if ref_name == strategy_name:
                                modified = True
                                continue # Remove strategy ref
                            if ref_name == deployment_name:
                                ref["weight"] = 100
                                modified = True
                            new_refs.append(ref)
                        if modified:
                            rule["backendRefs"] = new_refs
                    
                    if modified:
                        self.k8s_helper.apply_resource(route_dict)

            return f"Release ({active_role}) rolled back successfully"
        except Exception as e:
            return f"Error rolling back release: {str(e)}"
