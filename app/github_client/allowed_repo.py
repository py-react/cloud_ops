import os
import json
from typing import Dict, List, Optional

class AllowedRepoUtils:
    def __init__(self, json_path: Optional[str] = None):
        if json_path is None:
            json_path = os.path.join(os.getcwd(),"infra", "config", 'config.json')
        self.json_path = json_path
        if not os.path.exists(self.json_path):
            self._save({"allowed_repositories": {}, "allowed_branches": {}})

    def _load(self) -> Dict:
        with open(self.json_path, 'r') as f:
            return json.load(f)

    def _save(self, data: Dict):
        with open(self.json_path, 'w') as f:
            json.dump(data, f, indent=2)

    def get_all(self):
        data = self._load()
        return data["allowed_repositories"], data["allowed_branches"], data["deployments"]

    def add_repository(self, repo_name: str, repo_id: str, branches: List[str]):
        data = self._load()
        data["allowed_repositories"][repo_name] = repo_id
        data["allowed_branches"][repo_name] = branches
        self._save(data)

    def update_branches(self, repo_name: str, branches: List[str]):
        data = self._load()
        if repo_name in data["allowed_repositories"]:
            data["allowed_branches"][repo_name] = branches
            self._save(data)
        else:
            self.add_repository(repo_name=repo_name,repo_id=repo_name,branches=branches)

    def delete_repository(self, repo_name: str):
        data = self._load()
        if repo_name in data["allowed_repositories"]:
            del data["allowed_repositories"][repo_name]
            if repo_name in data["allowed_branches"]:
                del data["allowed_branches"][repo_name]
            self._save(data)
        else:
            raise KeyError(f"Repository {repo_name} not found.")

    def get_repository(self, repo_name: str):
        data = self._load()
        repo_id = data["allowed_repositories"].get(repo_name)
        branches = data["allowed_branches"].get(repo_name, [])
        if repo_id is not None:
            return {"repo_id": repo_id, "branches": branches}
        return None 