from fastapi import Request, BackgroundTasks
import shutil
import platform
import subprocess
import asyncio

async def GET(request: Request):
    tool = request.query_params.get("tool")
    if not tool:
        return {"error": True, "message": "Tool name required"}
        
    is_installed = shutil.which(tool) is not None
    os_name = platform.system().lower()
    
    return {
        "error": False,
        "tool": tool,
        "is_installed": is_installed,
        "os": os_name
    }

async def run_install_cmd(cmd: str, tool: str):
    try:
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            print(f"[{tool.title()} Install Success] {stdout.decode()[:200]}")
        else:
            print(f"[{tool.title()} Install Failed] {stderr.decode()}")
    except Exception as e:
        print(f"[{tool.title()} Install Error] {str(e)}")

async def POST(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    tool = body.get("tool")
    os_name = platform.system().lower()
    
    if shutil.which(tool):
        return {"error": False, "message": f"{tool.title()} is already installed."}
        
    try:
        if tool == "helm":
            if os_name == "darwin":
                cmd = "brew install helm"
            else:
                cmd = "curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
        elif tool == "docker":
            if os_name == "darwin":
                cmd = "brew install --cask docker"
            else:
                cmd = "curl -fsSL https://get.docker.com | sh"
        else:
            return {"error": True, "message": f"Unknown tool: {tool}"}
            
        background_tasks.add_task(run_install_cmd, cmd, tool)
        
        return {"error": False, "message": f"{tool.title()} installation started in the background. Please wait a moment."}
    except Exception as e:
        return {"error": True, "message": str(e)}
