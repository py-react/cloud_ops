import os
from fastapi import Request
from app.services.library_manager import LibraryManager
from fastapi.responses import JSONResponse

async def GET(request: Request, name: str = None):
    if not name:
        return JSONResponse(status_code=400, content={"detail": "Chart name is required"})
        
    manager = LibraryManager()
    template_path = manager.get_template_path(name)
    if not os.path.exists(template_path):
        return JSONResponse(status_code=404, content={"detail": "Template not found"})
        
    files = {}
    for root, dirs, filenames in os.walk(template_path):
        # Skip hidden dirs (e.g. .git)
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for filename in filenames:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, template_path)
            # Exclude root-level .yaml files that aren't Chart.yaml or values.yaml — those are env overrides
            if root == template_path and filename.endswith(".yaml") and filename not in ["Chart.yaml", "values.yaml"]:
                continue
            with open(full_path, "r") as f:
                try:
                    files[rel_path] = f.read()
                except:
                    pass  # Skip binary
    return {"files": files}

async def POST(request: Request):
    manager = LibraryManager()
    body = await request.json()
    name = body.get("name") or body.get("template")
    files = body.get("files")  # Dict of rel_path -> content
    
    if not name or files is None:
        return JSONResponse(status_code=400, content={"detail": "Name and files required"})
        
    template_path = manager.get_template_path(name)
    if not os.path.exists(template_path):
        return JSONResponse(status_code=404, content={"detail": "Chart not found"})

    try:
        # Write / update files
        for rel_path, content in files.items():
            file_path = os.path.join(template_path, rel_path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                f.write(content)

        # Remove files that were deleted in the UI (skip env override .yaml files at root and Chart.yaml/values.yaml)
        for root, dirs, filenames in os.walk(template_path):
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, template_path)
                # Skip env override files (root-level .yaml that isn't Chart.yaml or values.yaml)
                if root == template_path and filename.endswith(".yaml") and filename not in ["Chart.yaml", "values.yaml"]:
                    continue
                if rel_path not in files:
                    os.remove(full_path)

        # Determine more specific commit message
        custom_msg = body.get("commit_message")
        if custom_msg:
            msg = custom_msg
        else:
            changed_files = list(files.keys())
            msg = f"Updated chart '{name}': "
            parts = []
            if "Chart.yaml" in changed_files:
                parts.append("Manifest")
            if "values.yaml" in changed_files:
                parts.append("Default Values")
            
            # Check for templates
            if any(f.startswith("templates/") for f in changed_files):
                parts.append("Templates")
                
            if parts:
                msg += ", ".join(parts)
            else:
                msg += "Files"

        # Commit changes
        from app.services.library_version_manager import LibraryVersionManager
        lvm = LibraryVersionManager()
        lvm.commit(msg, chart_name=name)

        return {"status": "success"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
