import re
import uuid
import base64
import os
import shutil
import subprocess
import tempfile
import logging
from contextlib import contextmanager
from typing import Optional

logger = logging.getLogger(__name__)


def sanitize_docker_tag(name: str) -> str:
    """
    Sanitize a string to be a valid Docker tag.
    
    Docker tag requirements:
    - Must be lowercase
    - Can contain lowercase letters, digits, underscores, periods, and hyphens
    - Must start with a letter or digit
    - Cannot contain consecutive hyphens
    - Cannot end with a hyphen
    
    Args:
        name: The string to sanitize
        
    Returns:
        A valid Docker tag string
    """
    # Convert to lowercase
    sanitized = name.lower()
    
    # Replace invalid characters with underscores
    sanitized = re.sub(r'[^a-z0-9._-]', '_', sanitized)
    
    # Replace consecutive hyphens with single hyphen
    sanitized = re.sub(r'-+', '-', sanitized)
    
    # Replace consecutive underscores with single underscore
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Remove leading/trailing hyphens and underscores
    sanitized = sanitized.strip('-_')
    
    # Ensure it starts with a letter or digit
    if sanitized and not sanitized[0].isalnum():
        sanitized = 'img_' + sanitized
    
    # Ensure it's not empty
    if not sanitized:
        sanitized = 'image'
    
    # Limit length to reasonable size
    if len(sanitized) > 128:
        sanitized = sanitized[:128]
    
    return sanitized


def generate_image_name(repo_name: str, branch_name: str, registry_url: str = None, unique_id: Optional[str] = None) -> str:
    """
    Generate a unique Docker image name from repository and branch names.
    
    Args:
        repo_name: Full repository name (e.g., "owner/repo")
        branch_name: Branch name
        registry_url: Optional registry URL to prepend (e.g., "registry.docker.localhome.com")
        unique_id: Optional unique identifier to reuse (if None, generates new one)
        
    Returns:
        Unique image name with tag, optionally with registry URL
    """
    if unique_id is None:
        unique_id = str(uuid.uuid4())[:8]  # Use first 8 characters of UUID
    # Extract repo name without username (e.g., "github-webhook" from "Sandeep-yadav-hub/github-webhook")
    repo_name_only = repo_name.split('/')[-1] if '/' in repo_name else repo_name
    # Sanitize names for Docker tag requirements
    clean_repo_name = sanitize_docker_tag(repo_name_only)
    clean_branch_name = sanitize_docker_tag(branch_name)
    
    # Build image name
    base_name = f"{clean_repo_name}_{clean_branch_name}"
    
    if registry_url:
        # For registry, replace slashes with hyphens and add registry prefix
        repo_name_for_registry = base_name.replace('/', '-')
        return f"{registry_url}/{repo_name_for_registry}:{unique_id}"
    else:
        return f"{base_name}:{unique_id}"


def decode_github_content(content: str) -> str:
    """
    Decode base64 encoded content from GitHub API.
    
    Args:
        content: Base64 encoded content from GitHub
        
    Returns:
        Decoded string content
    """
    return base64.b64decode(content).decode('utf-8')


@contextmanager
def clone_repo(repo_full_name: str, branch: str, pat: str):
    """
    Context manager that clones a GitHub repository to a temporary directory.
    
    Args:
        repo_full_name: Full repository name (e.g., "owner/repo")
        branch: Branch to clone
        pat: GitHub Personal Access Token
        
    Yields:
        Path to the temporary directory containing the cloned repository
    """
    base_dir = "/tmp/cloud_ops/ci_cd/repos"
    os.makedirs(base_dir, exist_ok=True)
    
    temp_dir = tempfile.mkdtemp(dir=base_dir)
    try:
        # Construct clone URL with PAT for authentication
        clone_url = f"https://x-access-token:{pat}@github.com/{repo_full_name}.git"
        
        logger.info(f"Cloning {repo_full_name} branch {branch} to {temp_dir}")
        
        # Run git clone command
        subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, clone_url, "."],
            cwd=temp_dir,
            check=True,
            capture_output=True,
            text=True
        )
        
        yield temp_dir
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to clone repository {repo_full_name}: {e.stderr}")
        raise Exception(f"Failed to clone repository: {e.stderr}")
    finally:
        logger.info(f"Cleaning up temporary directory {temp_dir}")
        shutil.rmtree(temp_dir, ignore_errors=True)