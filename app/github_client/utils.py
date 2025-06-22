import re
import uuid
import base64
import logging

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


def generate_image_name(repo_name: str, branch_name: str) -> str:
    """
    Generate a unique Docker image name from repository and branch names.
    
    Args:
        repo_name: Full repository name (e.g., "owner/repo")
        branch_name: Branch name
        
    Returns:
        Unique image name with tag
    """
    unique_id = str(uuid.uuid4())[:8]  # Use first 8 characters of UUID
    # Extract repo name without username (e.g., "github-webhook" from "Sandeep-yadav-hub/github-webhook")
    repo_name_only = repo_name.split('/')[-1] if '/' in repo_name else repo_name
    # Sanitize names for Docker tag requirements
    clean_repo_name = sanitize_docker_tag(repo_name_only)
    clean_branch_name = sanitize_docker_tag(branch_name)
    return f"{clean_repo_name}_{clean_branch_name}:{unique_id}"


def decode_github_content(content: str) -> str:
    """
    Decode base64 encoded content from GitHub API.
    
    Args:
        content: Base64 encoded content from GitHub
        
    Returns:
        Decoded string content
    """
    return base64.b64decode(content).decode('utf-8') 