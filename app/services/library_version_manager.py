import os
import subprocess
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

STORAGE_ROOT = os.path.join(os.getcwd(), "storage", "library")

class LibraryVersionManager:
    def __init__(self):
        if not os.path.exists(os.path.join(STORAGE_ROOT, ".git")):
            self._init_repo()

    def _init_repo(self):
        os.makedirs(STORAGE_ROOT, exist_ok=True)
        try:
            subprocess.run(["git", "init"], cwd=STORAGE_ROOT, check=True)
            subprocess.run(["git", "config", "user.email", "cloud-ops@internal.ai"], cwd=STORAGE_ROOT, check=True)
            subprocess.run(["git", "config", "user.name", "Cloud Ops Assistant"], cwd=STORAGE_ROOT, check=True)
            subprocess.run(["git", "commit", "--allow-empty", "-m", "Initial commit"], cwd=STORAGE_ROOT, check=True)
        except Exception as e:
            logger.error(f"Failed to initialize git repo in {STORAGE_ROOT}: {e}")

    def commit(self, message: str, chart_name: Optional[str] = None, file_path: Optional[str] = None):
        """Commit changes to the library."""
        try:
            # Stage changes
            if file_path:
                # relative to STORAGE_ROOT
                subprocess.run(["git", "add", file_path], cwd=STORAGE_ROOT, check=True)
            elif chart_name:
                subprocess.run(["git", "add", chart_name], cwd=STORAGE_ROOT, check=True)
            else:
                subprocess.run(["git", "add", "."], cwd=STORAGE_ROOT, check=True)

            # Check if there are changes to commit
            status = subprocess.run(["git", "status", "--porcelain"], cwd=STORAGE_ROOT, capture_output=True, text=True)
            if not status.stdout.strip():
                return  # Nothing to commit

            subprocess.run(["git", "commit", "-m", message], cwd=STORAGE_ROOT, check=True)
        except Exception as e:
            logger.error(f"Failed to commit changes: {e}")

    def get_history(self, chart_name: Optional[str] = None, env_name: Optional[str] = None) -> List[Dict]:
        """Get commit history for a chart or a specific environment file."""
        try:
            path = "."
            if chart_name:
                if env_name:
                    filename = "values.yaml" if env_name == "default" else f"{env_name}.yaml"
                    path = os.path.join(chart_name, filename)
                else:
                    path = chart_name

            # git log --pretty=format:"%H|%an|%ad|%s" --date=iso
            cmd = ["git", "log", "--pretty=format:%H|%an|%ad|%s", "--date=iso", "--", path]
            result = subprocess.run(cmd, cwd=STORAGE_ROOT, capture_output=True, text=True, check=True)
            
            history = []
            for line in result.stdout.strip().split("\n"):
                if not line: continue
                parts = line.split("|")
                if len(parts) >= 4:
                    history.append({
                        "hash": parts[0],
                        "author": parts[1],
                        "date": parts[2],
                        "message": parts[3]
                    })
            return history
        except Exception as e:
            logger.error(f"Failed to get history: {e}")
            return []

    def get_diff(self, commit_hash: str, chart_name: Optional[str] = None, env_name: Optional[str] = None) -> str:
        """Get diff for a specific commit."""
        try:
            path = "."
            if chart_name:
                if env_name:
                    filename = "values.yaml" if env_name == "default" else f"{env_name}.yaml"
                    path = os.path.join(chart_name, filename)
                else:
                    path = chart_name

            cmd = ["git", "show", commit_hash, "--", path]
            result = subprocess.run(cmd, cwd=STORAGE_ROOT, capture_output=True, text=True, check=True)
            return result.stdout
        except Exception as e:
            logger.error(f"Failed to get diff: {e}")
            return str(e)

    def revert(self, commit_hash: str, chart_name: Optional[str] = None, env_name: Optional[str] = None, message: Optional[str] = None):
        """Revert a chart or environment to a specific commit."""
        try:
            path = "."
            if chart_name:
                if env_name:
                    filename = "values.yaml" if env_name == "default" else f"{env_name}.yaml"
                    path = os.path.join(chart_name, filename)
                else:
                    path = chart_name
            
            # Use git checkout to bring the file(s) to the desired state
            subprocess.run(["git", "checkout", commit_hash, "--", path], cwd=STORAGE_ROOT, check=True)
            
            # Commit the revert with a new commit (forward-only history)
            target = f"{chart_name}/{env_name}" if chart_name and env_name else (chart_name or "library")
            commit_msg = message or f"Rollback: Reverted {target} to version {commit_hash[:8]}"
            self.commit(commit_msg, chart_name=chart_name)
            return True
        except Exception as e:
            logger.error(f"Failed to revert: {e}")
            raise e

    def get_conflict_status(self) -> Dict:
        """Check if the repository has merge conflicts."""
        try:
            # Check if we are in a merging/rebasing state
            rebase_dir = os.path.join(STORAGE_ROOT, ".git", "rebase-merge")
            if not os.path.exists(rebase_dir):
                rebase_dir = os.path.join(STORAGE_ROOT, ".git", "rebase-apply")
            
            is_merging = os.path.exists(os.path.join(STORAGE_ROOT, ".git", "MERGE_HEAD")) or os.path.exists(rebase_dir)
            
            # Get unmerged files
            status = subprocess.run(["git", "status", "--porcelain"], cwd=STORAGE_ROOT, capture_output=True, text=True)
            conflicts = []
            for line in status.stdout.split("\n"):
                if line.startswith("UU ") or line.startswith("AA ") or line.startswith("U  ") or line.startswith("  U"):
                    conflicts.append(line[3:].strip())
            
            return {
                "has_conflicts": len(conflicts) > 0 or is_merging,
                "files": conflicts,
                "is_merging": is_merging
            }
        except Exception:
            return {"has_conflicts": False, "files": [], "is_merging": False}

    def resolve_conflict(self, file_path: str, content: str):
        """Save resolved content and mark as resolved."""
        full_path = os.path.join(STORAGE_ROOT, file_path)
        with open(full_path, "w") as f:
            f.write(content)
        subprocess.run(["git", "add", file_path], cwd=STORAGE_ROOT, check=True)

    def abort_sync(self):
        """Abort a failed rebase/merge."""
        subprocess.run(["git", "rebase", "--abort"], cwd=STORAGE_ROOT, capture_output=True)
        subprocess.run(["git", "merge", "--abort"], cwd=STORAGE_ROOT, capture_output=True)

    def continue_sync(self):
        """Continue a rebase after resolutions."""
        # Try to continue rebase
        res = subprocess.run(["git", "rebase", "--continue"], cwd=STORAGE_ROOT, capture_output=True, env={**os.environ, "GIT_EDITOR": "true"})
        if res.returncode != 0:
            # If not rebasing, maybe it was a merge
            subprocess.run(["git", "commit", "--no-edit"], cwd=STORAGE_ROOT, capture_output=True)
        
        # After continue, we should push
        return self.push()

    def pull(self):
        """Pull latest changes from remote without pushing."""
        from app.db_client.db import get_session
        from app.db_client.models.library_setting.library_setting import LibrarySetting
        from app.db_client.models.github_pat.github_pat import IntegrationCredential
        from sqlmodel import select

        with get_session() as session:
            setting = session.exec(select(LibrarySetting)).first()
            if not setting or not setting.github_credential_id or not setting.repo_name:
                raise Exception("GitOps settings not configured")

            from app.utils.credential_cache import get_credential_token
            token = get_credential_token(setting.github_credential_id, provider="github")
            
            owner = setting.repo_owner or "unknown"
            repo = setting.repo_name
            branch = setting.branch or "main"
            remote_url = f"https://x-access-token:{token}@github.com/{owner}/{repo}.git"
            
            try:
                subprocess.run(["git", "remote", "remove", "origin"], cwd=STORAGE_ROOT, capture_output=True)
                subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=STORAGE_ROOT, check=True)
                
                # Fetch and Attempt rebase
                subprocess.run(["git", "fetch", "origin", branch], cwd=STORAGE_ROOT, capture_output=True)
                rebase = subprocess.run(["git", "pull", "--rebase", "origin", branch], cwd=STORAGE_ROOT, capture_output=True, text=True)
                
                if rebase.returncode != 0:
                    logger.warning(f"Merge conflict detected during pull: {rebase.stderr}")
                    return {"status": "conflict", "message": "Merge conflicts detected during pull."}

                return {"status": "success", "message": "Pulled successfully"}
            except Exception as e:
                logger.error(f"Failed to pull: {e}")
                raise e

    def push(self):
        """Push local changes to the configured remote repository."""
        from app.db_client.db import get_session
        from app.db_client.models.library_setting.library_setting import LibrarySetting
        from app.db_client.models.github_pat.github_pat import IntegrationCredential
        from sqlmodel import select

        with get_session() as session:
            setting = session.exec(select(LibrarySetting)).first()
            if not setting or not setting.github_credential_id or not setting.repo_name:
                raise Exception("GitOps settings not configured (credential or repo missing)")

            from app.utils.credential_cache import get_credential_token
            token = get_credential_token(setting.github_credential_id, provider="github")
            
            owner = setting.repo_owner or "unknown"
            repo = setting.repo_name
            branch = setting.branch or "main"
            
            remote_url = f"https://x-access-token:{token}@github.com/{owner}/{repo}.git"
            
            try:
                # Add or update remote
                subprocess.run(["git", "remote", "remove", "origin"], cwd=STORAGE_ROOT, capture_output=True)
                subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=STORAGE_ROOT, check=True)
                
                # Fetch
                subprocess.run(["git", "fetch", "origin", branch], cwd=STORAGE_ROOT, capture_output=True)
                
                # Attempt rebase
                rebase = subprocess.run(["git", "pull", "--rebase", "origin", branch], cwd=STORAGE_ROOT, capture_output=True, text=True)
                if rebase.returncode != 0:
                    # CONFLICT DETECTED
                    logger.warning(f"Merge conflict detected during sync: {rebase.stderr}")
                    return {"status": "conflict", "message": "Merge conflicts detected. Manual resolution required."}

                # Push
                subprocess.run(["git", "push", "-u", "origin", branch], cwd=STORAGE_ROOT, check=True)
                return {"status": "success", "message": "Synchronized successfully"}
            except Exception as e:
                logger.error(f"Failed to push to remote: {e}")
                raise e
