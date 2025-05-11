from fastapi import Request

from app.docker_client import clientContext

async def meta_data():
    return {
        "title": "Docker (Packges)",
    }


async def index(request:Request):
    client = clientContext.client
    images = client.images.list(all=True)  # Get all containers (running or stopped)
    
    image_info = []

    for image in images:
        if image.tags:
            try:
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

                # You can also retrieve more info, like layers, parent id, etc.
                image_info.append(image_details)
            except Exception as e:
                print(f"Error retrieving info for image {[tag.split(':')[0] for tag in image.tags] if image.tags else 'None'}: {e}")
    
    return {"packageInfo": image_info}