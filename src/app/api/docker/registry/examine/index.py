from fastapi import Request, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from typing import Optional, List, Dict, Any
import requests
import urllib3
import gzip
import tarfile
import io
import json
import logging
from render_relay.utils import load_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def _get_registry_url() -> str:
    """Get registry URL from settings"""
    settings = load_settings()
    registry_host = settings.get("REGISTRY_HOST")
    if not registry_host:
        raise HTTPException(status_code=500, detail="Registry host not configured")
    return f"http://{registry_host}"


def _download_blob(registry_url: str, repo: str, sha256: str) -> bytes:
    """Download blob from registry"""
    blob_url = f"{registry_url}/v2/{repo}/blobs/sha256:{sha256}"
    response = requests.get(blob_url, timeout=30, verify=False)
    
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Blob sha256:{sha256} not found in repository {repo}")
    elif response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Failed to download blob: HTTP {response.status_code}")
    
    return response.content


def _decompress_layer(blob_data: bytes) -> tarfile.TarFile:
    """Decompress gzipped layer data and return TarFile object"""
    try:
        # Try to decompress as gzip
        decompressed = gzip.decompress(blob_data)
        tar_file = tarfile.open(fileobj=io.BytesIO(decompressed), mode='r')
        return tar_file
    except gzip.BadGzipFile:
        # Maybe it's not compressed or is a config blob
        try:
            # Try as uncompressed tar
            tar_file = tarfile.open(fileobj=io.BytesIO(blob_data), mode='r')
            return tar_file
        except tarfile.TarError:
            # Not a tar file, probably a config blob
            raise HTTPException(status_code=400, detail="Blob is not a tar file (possibly a config blob)")


def _list_tar_contents(tar_file: tarfile.TarFile) -> List[Dict[str, Any]]:
    """List contents of tar file similar to 'tar -tv'"""
    contents = []
    
    for member in tar_file.getmembers():
        file_info = {
            "name": member.name,
            "type": "file" if member.isfile() else "directory" if member.isdir() else "symlink" if member.issym() else "other",
            "size": member.size,
            "mode": oct(member.mode),
            "uid": member.uid,
            "gid": member.gid,
            "mtime": member.mtime,
            "is_file": member.isfile(),
            "is_dir": member.isdir(),
            "is_symlink": member.issym(),
        }
        
        if member.issym() or member.islnk():
            file_info["linkname"] = member.linkname
            
        contents.append(file_info)
    
    return contents


def _extract_file_from_tar(tar_file: tarfile.TarFile, file_path: str) -> bytes:
    """Extract specific file from tar"""
    try:
        member = tar_file.getmember(file_path)
        if not member.isfile():
            raise HTTPException(status_code=400, detail=f"{file_path} is not a file")
        
        file_obj = tar_file.extractfile(member)
        if file_obj is None:
            raise HTTPException(status_code=400, detail=f"Cannot extract {file_path}")
        
        return file_obj.read()
    except KeyError:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found in layer")


def _is_text_file(content: bytes, file_path: str) -> bool:
    """Determine if content is likely a text file"""
    # Check file extension
    text_extensions = {'.txt', '.sh', '.py', '.js', '.json', '.xml', '.html', '.css', '.yml', '.yaml', '.conf', '.cfg', '.ini', '.log'}
    if any(file_path.lower().endswith(ext) for ext in text_extensions):
        return True
    
    # Check for binary content
    try:
        content.decode('utf-8')
        return True
    except UnicodeDecodeError:
        return False


async def GET(
    request: Request,
    repo: str = Query(..., description="Repository name (e.g., github-webhook_test)"),
    sha256: str = Query(..., description="SHA256 digest of the blob (without sha256: prefix)"),
    action: str = Query("list", description="Action: 'list' to show files, 'file' to extract file, 'config' to view config"),
    file_path: Optional[str] = Query(None, description="Path to file within layer (for action=file)"),
    format: str = Query("json", description="Response format: 'json' or 'raw' (for file content)")
):
    """
    Examine Docker registry blobs (layers and configs)
    
    Examples:
    - List layer contents: GET /examine?repo=github-webhook_test&sha256=9994ea1088e3f1d0eb3dea855f32e7e63742b2644c8611c124ba81bc3453047e&action=list
    - Extract file: GET /examine?repo=github-webhook_test&sha256=9994ea1088e3f1d0eb3dea855f32e7e63742b2644c8611c124ba81bc3453047e&action=file&file_path=etc/passwd
    - View config: GET /examine?repo=github-webhook_test&sha256=69efe5fc06316a533b5c4864d13f90abd41103a06af77ded188c7ba3f25937f4&action=config
    """
    
    try:
        registry_url = _get_registry_url()
        logger.info(f"Examining blob sha256:{sha256} in repo {repo}, action: {action}")
        
        # Download blob
        blob_data = _download_blob(registry_url, repo, sha256)
        logger.info(f"Downloaded blob: {len(blob_data)} bytes")
        
        if action == "config":
            # Handle config blob
            try:
                config_json = json.loads(blob_data.decode('utf-8'))
                return JSONResponse(
                    status_code=200,
                    content={
                        "type": "config",
                        "sha256": sha256,
                        "size": len(blob_data),
                        "config": config_json
                    }
                )
            except (json.JSONDecodeError, UnicodeDecodeError):
                raise HTTPException(status_code=400, detail="Blob is not a valid JSON config")
        
        elif action == "list":
            # List layer contents
            tar_file = _decompress_layer(blob_data)
            try:
                contents = _list_tar_contents(tar_file)
                
                # Summary statistics
                total_files = sum(1 for item in contents if item["is_file"])
                total_dirs = sum(1 for item in contents if item["is_dir"])
                total_size = sum(item["size"] for item in contents if item["is_file"])
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "type": "layer",
                        "sha256": sha256,
                        "compressed_size": len(blob_data),
                        "summary": {
                            "total_entries": len(contents),
                            "files": total_files,
                            "directories": total_dirs,
                            "total_uncompressed_size": total_size
                        },
                        "contents": contents
                    }
                )
            finally:
                tar_file.close()
        
        elif action == "file":
            # Extract specific file
            if not file_path:
                raise HTTPException(status_code=400, detail="file_path parameter required for action=file")
            
            tar_file = _decompress_layer(blob_data)
            try:
                file_content = _extract_file_from_tar(tar_file, file_path)
                
                if format == "raw":
                    # Return raw file content
                    is_text = _is_text_file(file_content, file_path)
                    content_type = "text/plain; charset=utf-8" if is_text else "application/octet-stream"
                    
                    return Response(
                        content=file_content,
                        media_type=content_type,
                        headers={
                            "X-File-Path": file_path,
                            "X-File-Size": str(len(file_content)),
                            "X-Is-Text": str(is_text).lower()
                        }
                    )
                else:
                    # Return JSON with file info
                    is_text = _is_text_file(file_content, file_path)
                    
                    response_data = {
                        "type": "file",
                        "sha256": sha256,
                        "file_path": file_path,
                        "size": len(file_content),
                        "is_text": is_text
                    }
                    
                    if is_text and len(file_content) < 1024 * 1024:  # Max 1MB for text preview
                        try:
                            response_data["content"] = file_content.decode('utf-8')
                        except UnicodeDecodeError:
                            response_data["content"] = file_content.decode('utf-8', errors='replace')
                    else:
                        response_data["content"] = f"<binary file, {len(file_content)} bytes>"
                        response_data["download_url"] = f"/api/docker/registry/examine?repo={repo}&sha256={sha256}&action=file&file_path={file_path}&format=raw"
                    
                    return JSONResponse(status_code=200, content=response_data)
            finally:
                tar_file.close()
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action}. Use 'list', 'file', or 'config'")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error examining blob: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")