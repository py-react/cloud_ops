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

    def get_builds(self,repo_name,base_branch):
        return get_source_code_build(self.session,repo_name=repo_name,base_branch=base_branch)
    
    def get_last_builds_for_all_repo_branches(self)->Dict[str, Dict[str, Optional[SourceCodeBuildWithLogsType]]]:
        """
        Returns a dict of the form {repo_name: {branch_name: last_build_or_None}}
        """
        result = {}
    
        # Get all repos and branches
        _, branches, _, _ = self.get_all()
        for repo_name, branch_list in branches.items():
            result[repo_name] = {}
            for branch_name in branch_list:
                builds = get_source_code_build(self.session, repo_name=repo_name, branch_name=branch_name, last=True)
                if builds and len(builds) > 0:
                    result[repo_name][branch_name] = builds[0]
                else:
                    result[repo_name][branch_name] = None
        return result 

    def get_all(self):
        # First, get all deployment configs
        deployment_configs = list_deployment_configs(self.session)
        # Get all repos
        repos = list_code_source_controls(self.session)
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
                    "tag": d["tag"],
                    "pr_url": d.get("pr_url"),
                    "jira": d.get("jira"),
                }
        
        # Build PAT map
        repo_pats = {r.name: r.pat_id for r in repos}
        
        return result, branches, deployments, repo_pats

    def add_repository(self, repo_name: str, repo_id: str, branches: List[str], pat_id: Optional[int] = None):
        # repo_id is ignored, as DB will auto-generate
        repo = create_code_source_control(self.session, CodeSourceControlType(name=repo_name, pat_id=pat_id))
        if not repo:
            raise Exception(f"Failed to create repository {repo_name}")
        if not repo.id:
            raise Exception(f"Repository ID not found after creation for {repo_name}")
        for branch in branches:
            create_code_source_control_branch(
                self.session,
                CodeSourceControlBranchType(code_source_control_id=repo.id, branch=branch)
            )

    def update_branches(self, repo_name: str, branches: List[str], pat_id: Optional[int] = None):
        repos = list_code_source_controls(self.session)
        repo = next((r for r in repos if r.name == repo_name), None)
        repo_id = repo.id if repo else None
        if not repo or not repo_id:
            self.add_repository(repo_name=repo_name, repo_id=repo_name, branches=branches, pat_id=pat_id)
            return

        # Update PAT ID if provided (allow unsetting if explicit logic needed, but for now assuming if provided we update)
        # Note: If pat_id is None, we might not want to clear it if the user just edited branches. 
        # But based on the request model, we receive pat_id. 
        # Safe strategy: Only update if pat_id is logically meant to be updated. 
        # Given the frontend sends whatever it has, we should probably update it.
        if pat_id is not None:
             repo.pat_id = pat_id
             self.session.add(repo)
             self.session.commit()
             self.session.refresh(repo)

        # Delete all old branches and add new ones
        old_branches = list_code_source_control_branches(self.session, repo_id)
        for b in old_branches:
            self.session.delete(b)
        self.session.commit()
        for branch in branches:
            create_code_source_control_branch(
                self.session,
                CodeSourceControlBranchType(code_source_control_id=repo_id, branch=branch)
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
        repo = next((r for r in repos if r.name == repo_name), None)
        repo_id = repo.id if repo else None
        if not repo or not repo_id:
            return None
        branches = list_code_source_control_branches(self.session, repo_id)
        return {"repo_id": repo_id, "branches": [b.branch for b in branches]} 