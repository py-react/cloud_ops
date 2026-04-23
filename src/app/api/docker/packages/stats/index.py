import docker
from fastapi import Request
from typing import Optional
from app.docker_client import clientContext

async def GET(request: Request):
    """
    Returns image sizes for all tagged images.
    Used for lazy-loading in the UI to keep the initial list fetch fast.
    """
    try:
        client = clientContext.get_client()
        # Use low-level API for stats as well to maintain high performance.
        # This returns a list of dictionaries which already include 'Size'.
        images = client.api.images(all=False)
        
        stats = {}
        for image_dict in images:
            # Low-level API uses 'Id' and 'Size' keys
            img_id = image_dict.get('Id')
            if img_id and image_dict.get('RepoTags'):
                stats[img_id] = {
                    "size": image_dict.get('Size', 0),
                    "virtual_size": image_dict.get('Size', 0) # VirtualSize not provided in minimal API, fallback to Size
                }
        
        return {"stats": stats}
    except Exception as e:
        return {"error": True, "message": str(e)}
