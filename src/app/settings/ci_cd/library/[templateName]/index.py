from fastapi import Request
from app.services.library_manager import LibraryManager
import logging

logger = logging.getLogger(__name__)

async def index(request: Request):
    template_name = request.path_params.get("templateName")
    manager = LibraryManager()
    
    try:
        # Get template files
        template_path = manager.get_template_path(template_name)
        files = {}
        import os
        if os.path.exists(template_path):
            for root, dirs, filenames in os.walk(template_path):
                for filename in filenames:
                    if filename.endswith((".yaml", ".yml", ".tpl", "Chart.yaml")):
                        full_path = os.path.join(root, filename)
                        rel_path = os.path.relpath(full_path, template_path)
                        with open(full_path, "r") as f:
                            files[rel_path] = f.read()
        
        # Get environments
        environments = []
        all_values = manager.list_values()
        for v in all_values:
            if v["template"] == template_name:
                environments.append(v)
                
        return {
            "templateName": template_name,
            "files": files,
            "environments": environments
        }
    except Exception as e:
        logger.error(f"Error loading template details: {e}")
        return {
            "templateName": template_name,
            "files": {},
            "environments": [],
            "error": str(e)
        }
