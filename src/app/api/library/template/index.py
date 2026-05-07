import os
import yaml
from fastapi import Request, BackgroundTasks
from app.services.library_manager import LibraryManager
from fastapi.responses import JSONResponse

async def POST(request: Request, background_tasks: BackgroundTasks):
    manager = LibraryManager()
    body = await request.json()
    name = body.get("name")
    description = body.get("description", f"A Helm chart for {name}")
    version = body.get("version", "0.1.0")
    app_version = body.get("appVersion", "latest")

    if not name:
        return JSONResponse(status_code=400, content={"detail": "Chart name is required"})

    try:
        chart_path = manager.get_template_path(name)
        if os.path.exists(chart_path):
            return JSONResponse(status_code=400, content={"detail": "Chart already exists"})

        os.makedirs(os.path.join(chart_path, "templates"), exist_ok=True)

        # Chart.yaml
        chart_content = {
            "apiVersion": "v2",
            "name": name,
            "description": description,
            "type": "application",
            "version": version,
            "appVersion": app_version,
        }
        with open(os.path.join(chart_path, "Chart.yaml"), "w") as f:
            yaml.dump(chart_content, f, default_flow_style=False)

        # values.yaml — default values for all environments
        with open(os.path.join(chart_path, "values.yaml"), "w") as f:
            f.write("# Default values for all environments\n")

        # templates/app.yaml — single file for all K8s resources
        starter = (
            "# Define all Kubernetes resources here, separated by ---\n"
            "# Example:\n"
            "# apiVersion: apps/v1\n"
            "# kind: Deployment\n"
            "# metadata:\n"
            f"#   name: {name}\n"
        )
        with open(os.path.join(chart_path, "templates", "app.yaml"), "w") as f:
            f.write(starter)

        # Commit initial chart creation
        custom_msg = body.get("commit_message")
        msg = custom_msg if custom_msg else f"Created new chart template '{name}'"
        
        from app.services.library_version_manager import LibraryVersionManager
        lvm = LibraryVersionManager()
        lvm.commit(msg, chart_name=name)
        
        from app.db_client.db import get_session
        from app.db_client.models.library_setting.library_setting import LibrarySetting
        from sqlmodel import select
        with get_session() as session:
            setting = session.exec(select(LibrarySetting)).first()
            if setting and setting.auto_push:
                from app.services.library_sync_worker import run_background_sync
                background_tasks.add_task(run_background_sync)

        return {"status": "created", "name": name}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": str(e)})


async def DELETE(request: Request, background_tasks: BackgroundTasks, name: str):
    manager = LibraryManager()
    try:
        manager.delete_template(name)
        
        from app.db_client.db import get_session
        from app.db_client.models.library_setting.library_setting import LibrarySetting
        from sqlmodel import select
        with get_session() as session:
            setting = session.exec(select(LibrarySetting)).first()
            if setting and setting.auto_push:
                from app.services.library_sync_worker import run_background_sync
                background_tasks.add_task(run_background_sync)
                
        return {"status": "deleted"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
