import platform
import os
import subprocess
import stat
from fastapi import Request
from pydantic import BaseModel

class InstallLocalRequest(BaseModel):
    key_name: str
    private_key: str

async def POST(request: Request, body: InstallLocalRequest):
    """
    Write a private key to the host machine's ~/.ssh directory so the user can
    SSH from their own terminal without extra steps.
    Detects OS automatically and sets correct permissions.
    """
    try:
        system = platform.system()  # 'Darwin', 'Linux', 'Windows'

        if system == "Windows":
            ssh_dir = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\User"), ".ssh")
        else:
            # Darwin (macOS) and Linux both use ~/.ssh
            ssh_dir = os.path.expanduser("~/.ssh")

        # Make sure ~/.ssh exists with tight permissions
        os.makedirs(ssh_dir, exist_ok=True)
        if system != "Windows":
            os.chmod(ssh_dir, stat.S_IRWXU)  # 700

        # Sanitise the key name so it's safe for a filename
        safe_name = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in body.key_name)
        key_path = os.path.join(ssh_dir, f"id_{safe_name}")

        # Write private key — always end with a newline (PEM requirement)
        private_key_content = body.private_key.strip() + "\n"
        with open(key_path, "w") as f:
            f.write(private_key_content)

        # Set chmod 600 on non-Windows
        if system != "Windows":
            os.chmod(key_path, stat.S_IRUSR | stat.S_IWUSR)  # 600

        # Also try to add to ssh-agent silently (best-effort)
        agent_added = False
        if system in ("Darwin", "Linux"):
            try:
                result = subprocess.run(
                    ["ssh-add", key_path],
                    capture_output=True, timeout=5
                )
                agent_added = result.returncode == 0
            except Exception:
                pass  # Agent may not be running — that's fine

        return {
            "error": False,
            "key_path": key_path,
            "os": system,
            "agent_added": agent_added,
            "message": f"Private key written to {key_path}"
                       + (" and added to ssh-agent." if agent_added else ".")
        }

    except Exception as e:
        return {"error": True, "message": str(e)}
