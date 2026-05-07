from typing import List, Optional,Dict
from sqlmodel import Session
from app.db_client.db import get_session
from app.db_client.controllers.source_code_build import get_source_code_build
from app.db_client.models.source_code_build.types import SourceCodeBuildWithLogsType
from app.db_client.controllers.code_source_control import (
    create_code_source_control, list_code_source_controls
)
from app.db_client.controllers.code_source_control_branch import (
    create_code_source_control_branch, list_code_source_control_branches
)
from app.db_client.controllers.deployment_config import list_deployment_configs
from app.db_client.controllers.source_code_build import get_source_code_build 
from app.db_client.models.code_source_control.types import CodeSourceControlType
from app.db_client.models.code_source_control_branch.types import CodeSourceControlBranchType
from app.db_client.models.code_source_control.code_source_control import CodeSourceControl




class AllowedRepoUtils:
    def __init__(self, session: Optional[Session] = None):
        if session is None:
            # Use context manager to get a session if not provided
            self.session_ctx = get_session()
            self.session = self.session_ctx.__enter__()
        else:
            self.session = session
            self.session_ctx = None

    def __del__(self):
        if self.session_ctx:
            self.session_ctx.__exit__(None, None, None)

    def get_builds(self, repo_name: str, branch_name: Optional[str] = None):
        # We filter by the target branch (base_branch_name) as requested
        # Support ID lookup if repo_name is numeric
        final_repo_name = repo_name
        if repo_name.isdigit():
            repo = self.session.get(CodeSourceControl, int(repo_name))
            if repo:
                final_repo_name = repo.name

        return get_source_code_build(self.session, repo_name=final_repo_name, base_branch=branch_name)
    
    def get_last_builds_for_all_repo_branches(self)->Dict[str, Dict[str, Optional[SourceCodeBuildWithLogsType]]]:
        """
        Returns a dict of the form {repo_name: {branch_name: last_build_or_None}}
        """
        result = {}
    
        # Get all repos and branches (now branches is {repo: [{branch: "main", ...}]})
        _, branches, _, _, _, _, _ = self.get_all()
        for repo_name, branch_list in branches.items():
            result[repo_name] = {}
            for branch_config in branch_list:
                branch_name = branch_config["branch"]
                builds = get_source_code_build(self.session, repo_name=repo_name, branch_name=branch_name, last=True)
                if builds and len(builds) > 0:
                    result[repo_name][branch_name] = builds[0]
                else:
                    result[repo_name][branch_name] = None
        return result 

    def get_all(self):
        # First, get all deployment configs
        deployment_configs = list_deployment_configs(self.session)
        # Get all repos and filter out those that are terminating
        all_repos = list_code_source_controls(self.session)
        repos = [r for r in all_repos if r.status != 'terminating']
        result = {}
        branches = {}
        deployments = {}

        # Build a mapping from deployment_name to deployment config
        # deployment_configs is now a list of dicts
        deployment_map = {d["deployment_name"]: d for d in deployment_configs}

        for repo in repos:
            result[repo.name] = str(repo.id)  # Ensure repo id is a string
            if not repo.id:
                continue
            branch_objs = list_code_source_control_branches(self.session, repo.id)
            branches[repo.name] = [b.branch for b in branch_objs]
            # Use the deployment_map to find the deployment config for this repo
            d = deployment_map.get(repo.name)
            if d:
                deployments[repo.name] = {
                    "id": d["id"],
                    "type": d["type"],
                    "namespace": d["namespace"],
                    "deployment_name": d["deployment_name"],
                    "strategy": d.get("strategy"),
                    "tag": d.get("tag"),
                    "pr_url": d.get("pr_url"),
                    "jira": d.get("jira"),
                }
        
        # Build PAT map
        repo_pats = {r.name: r.pat_id for r in repos}
        repo_registries = {r.name: r.registry_id for r in repos}
        repo_engines = {r.name: r.docker_config_id for r in repos}
        repo_polling_enabled = {r.name: r.polling_enabled for r in repos}

        # Update branches to return objects
        branches_with_config = {}
        for repo in repos:
            branch_objs = list_code_source_control_branches(self.session, repo.id)
            branches_with_config[repo.name] = [
                {
                    "branch": b.branch,
                    "registry_id": b.registry_id,
                    "docker_config_id": b.docker_config_id
                } for b in branch_objs
            ]
        
        return result, branches_with_config, deployments, repo_pats, repo_registries, repo_engines, repo_polling_enabled

    def add_repository(self, repo_name: str, repo_id: str, branches: List[dict], pat_id: Optional[int] = None, registry_id: Optional[int] = None, docker_config_id: Optional[int] = None):
        # repo_id is ignored, as DB will auto-generate
        repo = create_code_source_control(
            self.session, 
            CodeSourceControlType(
                name=repo_name, 
                pat_id=pat_id, 
                registry_id=registry_id,
                docker_config_id=docker_config_id,
                polling_enabled=False
            )
        )
        if not repo:
            raise Exception(f"Failed to create repository {repo_name}")
        if not repo.id:
            raise Exception(f"Repository ID not found after creation for {repo_name}")
        for branch_data in branches:
            create_code_source_control_branch(
                self.session,
                CodeSourceControlBranchType(
                    code_source_control_id=repo.id, 
                    branch=branch_data["branch"],
                    registry_id=branch_data.get("registry_id"),
                    docker_config_id=branch_data.get("docker_config_id")
                )
            )

    def update_branches(self, repo_name: str, branches: List[dict], pat_id: Optional[int] = None, registry_id: Optional[int] = None, docker_config_id: Optional[int] = None):
        repos = list_code_source_controls(self.session)
        repo = next((r for r in repos if r.name == repo_name), None)
        repo_id = repo.id if repo else None
        if not repo or not repo_id:
            self.add_repository(repo_name=repo_name, repo_id=repo_name, branches=branches, pat_id=pat_id, registry_id=registry_id, docker_config_id=docker_config_id)
            return

        # Update Repository settings unconditionally
        updated = False
        target_docker_config = None if docker_config_id == 0 else docker_config_id
        
        if repo.pat_id != pat_id:
            repo.pat_id = pat_id
            updated = True
             
        if repo.registry_id != registry_id:
            repo.registry_id = registry_id
            updated = True
        
        if repo.docker_config_id != target_docker_config:
            repo.docker_config_id = target_docker_config
            updated = True
        
        if updated:
             self.session.add(repo)
             self.session.commit()
             self.session.refresh(repo)

        # Delete all old branches and add new ones (each with their specific config)
        old_branches = list_code_source_control_branches(self.session, repo_id)
        for b in old_branches:
            self.session.delete(b)
        self.session.commit()
        for branch_data in branches:
            create_code_source_control_branch(
                self.session,
                CodeSourceControlBranchType(
                    code_source_control_id=repo_id, 
                    branch=branch_data["branch"],
                    registry_id=branch_data.get("registry_id"),
                    docker_config_id=branch_data.get("docker_config_id")
                )
            )

    def delete_repository(self, repo_name: str):
        repos = list_code_source_controls(self.session)
        repo = next((r for r in repos if r.name == repo_name), None)
        repo_id = repo.id if repo else None
        if not repo or not repo_id:
            raise KeyError(f"Repository {repo_name} not found.")
        # Delete all branches
        old_branches = list_code_source_control_branches(self.session, repo_id)
        for b in old_branches:
            self.session.delete(b)
        self.session.delete(repo)
        self.session.commit()

    def get_repository(self, repo_name: str):
        repos = list_code_source_controls(self.session)
        # Support ID lookup
        if repo_name.isdigit():
            repo = next((r for r in repos if str(r.id) == repo_name), None)
        else:
            repo = next((r for r in repos if r.name == repo_name), None)
            
        repo_id = repo.id if repo else None
        if not repo or not repo_id:
            return None
        branches = list_code_source_control_branches(self.session, repo_id)
        return {
            "repo_id": repo_id, 
            "status": getattr(repo, 'status', 'active'), 
            "polling_enabled": getattr(repo, 'polling_enabled', False),
            "branches": [{"branch": b.branch, "registry_id": b.registry_id, "docker_config_id": b.docker_config_id} for b in branches]
        }

    def update_polling_status(self, repo_name: str, enabled: bool):
        repos = list_code_source_controls(self.session)
        repo = next((r for r in repos if r.name == repo_name), None)
        if not repo:
            raise KeyError(f"Repository {repo_name} not found.")
        
        repo.polling_enabled = enabled
        self.session.add(repo)
        self.session.commit()
        self.session.refresh(repo)
        return repo

    def perform_full_deletion(self, repo_name: str):
        from app.db_client.models.code_source_control_branch.code_source_control_branch import CodeSourceControlBranch
        from app.db_client.models.source_code_build.source_code_build import SourceCodeBuild, SourceCodeBuildLog
        from sqlmodel import select, delete
        
        # Always use a fresh session for background tasks
        with get_session() as session:
            repos = session.exec(select(CodeSourceControl)).all()
            repo = next((r for r in repos if r.name == repo_name), None)
            repo_id = repo.id if repo else None
            if not repo or not repo_id:
                return

            # Unlink DeploymentConfigs that depend on this repository
            from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
            dcs = session.exec(select(DeploymentConfig).where(DeploymentConfig.code_source_control_name == repo_name)).all()
            for dc in dcs:
                dc.code_source_control_name = None
                dc.source_control_branch = None
                dc.required_source_control = False
                session.add(dc)
            
            # Delete logs and builds
            builds = session.exec(select(SourceCodeBuild).where(SourceCodeBuild.repo_name == repo_name)).all()
            for build in builds:
                session.exec(delete(SourceCodeBuildLog).where(SourceCodeBuildLog.build_id == build.id))
            session.exec(delete(SourceCodeBuild).where(SourceCodeBuild.repo_name == repo_name))
            
            # Delete branches
            session.exec(delete(CodeSourceControlBranch).where(CodeSourceControlBranch.code_source_control_id == repo_id))
            
            # Delete repo
            session.delete(repo)
            session.commit()