import docker
import docker.utils
from fastapi import Request
from pydantic import BaseModel
from enum import Enum
import tempfile
import os
import traceback
from io import BytesIO
from typing import List, Dict, Optional


from app.docker_client import clientContext

client = clientContext.client


class ActionTypeEnum(str, Enum):
    RUN = 'run'
    REMOVE = 'remove'
    PULL = "pull"
    CREATE = "crete"

class PullConfig(BaseModel):
    image:str
    registry:str = "docker.io"

class CreateConfig(BaseModel):
    content:str
    tag:str = None

class RunImage(BaseModel):
    action:str
    packageId:str = ""
    pull_config:PullConfig = None
    create_config: CreateConfig = None


def run_container(image_id):
    """Run a container from the given image ID."""
    # Run a container from the image ID (detached mode)
    container = client.containers.run(image_id, detach=True)
    container.update()
    print(f"Container {container.id} is running from image {image_id}")
    

def remove_image(image_id):
    """Remove the image with the given image ID, only if no containers are using it."""

    # Check if there are any containers using this image
    containers_using_image = client.containers.list(all=True, filters={"ancestor": image_id})
    
    if containers_using_image:
        # Build the message for containers using the image
        message = f"The image {image_id} cannot be removed because the following containers are using it:\n"
        for container in containers_using_image:
            message += f"  - Container {container.id} ({container.status})\n"
        message += "Please stop or remove the containers before removing the image."

        # Raise a standard exception with the message and additional data in __dict__
        ex = Exception("Image in use by running containers." )
        ex.__dict__["explanation"] = message
        raise ex
    else:
        # No containers using the image, so safe to remove
        client.images.remove(image_id,force=True)
        print(f"Image {image_id} has been removed successfully.")

def pull_image(image_name: str):
    """
    Pulls an image from either a local registry or a remote registry.
    """
    # Attempt to pull the image
    image = client.images.pull(image_name)
    return image


async def build_from_string(dockerfile_string, tag):

    try:
        # Use the low-level API client
        # Build the image using the build method
        f = BytesIO(dockerfile_string.encode('utf-8'))
        image, logs = client.images.build(fileobj=f, tag=tag,forcerm=True, rm=True,pull=False,labels={"com.docker.my.package":"_"+tag})
        # Loop through each image and retrieve information
        image_details = {}
        # Extract image name (repo name) and tag from the tags
        image_details['name'] = [tag.split(":")[0] for tag in image.tags] if image.tags else "None"
        image_details['id'] = image.id
        image_details['tags'] = image.tags
        image_details['created'] = image.attrs['Created']
        image_details['size'] = image.attrs['Size']
        image_details['virtual_size'] = image.attrs.get('VirtualSize',"N/A")
        image_details['repo_tags'] = image.attrs['RepoTags']
        image_details['labels'] = image.attrs.get('Labels', {})
        # Return the built image and logs
        return {"image":image_details, "logs":logs}
    
    except docker.errors.BuildError as build_error:
        # Handle errors that occur during image build
        ex = Exception(f"Error building image")
        ex.__dict__["explanation"] = f"Error building image: {build_error}"
        raise ex

    except docker.errors.APIError as api_error:
        # Handle errors that occur due to Docker daemon issues
        ex = Exception(f"Docker API error")
        ex.__dict__["explanation"] = f"Docker API error: {api_error}"
        raise ex

    except Exception as e:
        # Handle any other unexpected errors
        ex = Exception(f"Unexpected error")
        ex.__dict__["explanation"] = f"Unexpected error: {e}"
        raise ex
        
class Package_Info(BaseModel):
    name: List[str]  # Repo name(s) extracted from image tags
    id: str          # Unique image ID
    tags: List[str]  # List of image tags
    created: str     # Creation timestamp of the image
    size: int        # Size of the image
    virtual_size: int  # Virtual size of the image (could be string like "N/A")
    repo_tags: List[str]  # List of repository tags
    labels: Optional[Dict[str, str]] = {}  # Optional dictionary of labels, defaults to empty dict


class Get_Packages_Response(BaseModel):
    packages:List[Package_Info]

async def GET(request: Request, id: Optional[str] = None):
    if id:
        try:
            image = client.images.get(id)
            history = image.history()
            
            # Format history to be more frontend friendly. 
            # Docker history returns list of dicts: {'Comment': '', 'Created': 123, 'CreatedBy': '/bin/sh', 'Id': '<sha>', 'Size': 123, 'Tags': []}
            formatted_history = []
            for layer in history:
                formatted_history.append({
                    "id": layer.get("Id", "missing"),
                    "created": layer.get("Created", 0),
                    "created_by": layer.get("CreatedBy", ""),
                    "tags": layer.get("Tags", []),
                    "size": layer.get("Size", 0),
                    "comment": layer.get("Comment", "")
                })

            image_details = {}
            image_details['name'] = [tag.split(":")[0] for tag in image.tags] if image.tags else "None"
            image_details['id'] = image.id
            image_details['tags'] = image.tags
            image_details['created'] = image.attrs['Created']
            image_details['size'] = image.attrs['Size']
            image_details['virtual_size'] = image.attrs.get('VirtualSize', "N/A")
            image_details['repo_tags'] = image.attrs['RepoTags']
            image_details['labels'] = image.attrs.get('Labels', {})
            image_details['os'] = image.attrs.get('Os', 'N/A')
            image_details['architecture'] = image.attrs.get('Architecture', 'N/A')
            image_details['author'] = image.attrs.get('Author', 'N/A')
            image_details['config'] = image.attrs.get('Config', {})
            image_details['graph_driver'] = image.attrs.get('GraphDriver', {})
            image_details['root_fs'] = image.attrs.get('RootFS', {})

            return {
                "package": image_details,
                "history": formatted_history
            }
        except docker.errors.ImageNotFound:
             return {"error": True, "message": "Image not found"}
        except Exception as e:
            return {"error": True, "message": str(e)}

    # List all images if no ID provided
    images = client.images.list(all=True)
    
    image_info = []

    for image in images:
        if image.tags:
            try:
                image_details = {}
                image_details['name'] = [tag.split(":")[0] for tag in image.tags] if image.tags else "None"
                image_details['id'] = image.id
                image_details['tags'] = image.tags
                image_details['created'] = image.attrs['Created']
                image_details['size'] = image.attrs['Size']
                image_details['virtual_size'] = image.attrs.get('VirtualSize',"N/A")
                image_details['repo_tags'] = image.attrs['RepoTags']
                image_details['labels'] = image.attrs.get('Labels', {})

                image_info.append(image_details)
            except Exception as e:
                print(f"Error retrieving info: {e}")
    
    return {"packages": image_info}

async def POST(request:Request,body: RunImage):
    actionType = body.action
    # Get all containers that are running and match the stored names

    try:
        if actionType == "pull":
            if not body.pull_config.image:
                return({"error":True,"message":f"Image name is required'."})
            
            image_name = body.pull_config.image
            registry = body.pull_config.registry

            # If a registry is specified, prepend it to the image name
            if registry:
                image_name = f"{registry}/{image_name}"

            # Try pulling the image
            image = pull_image(image_name)

            # Loop through each image and retrieve information
            image_details = {}
            # Extract image name (repo name) and tag from the tags
            image_details['name'] = [tag.split(":")[0] for tag in image.tags] if image.tags else "None"
            image_details['id'] = image.id
            image_details['tags'] = image.tags
            image_details['created'] = image.attrs['Created']
            image_details['size'] = image.attrs['Size']
            image_details['virtual_size'] = image.attrs.get('VirtualSize',"N/A")
            image_details['repo_tags'] = image.attrs['RepoTags']
            image_details['labels'] = image.attrs.get('Labels', {})

            return {"error":False, "message":f"Image {image_name} pulled successfully.","package": image_details}
        
        if actionType == "create":
            package_content = body.create_config.content
            tag = body.create_config.tag
            created_image = await build_from_string(package_content,tag)
            # Loop through each image and retrieve information
            return {"error":False, "message":f"Created Image {created_image['image']['id']}","image":created_image['image']}
        
        image_id = body.packageId

        if actionType == "run":
            run_container(image_id)
            return {"error":False,"message":f"Running {image_id} in a container", "image_ran": [image_id]}
        if actionType == "remove":
            remove_image(image_id)
            return {"error":False, "message":f"Removed {image_id}", "images_removed": [image_id]}

        return({"error":True,"message":f"Invalid action: {actionType}. Allowed actions are 'run', 'remove', 'pull', 'create'."})
        
    except Exception as e:
        return {"error": True, "message": e.__dict__.get("explanation", str(e))}
