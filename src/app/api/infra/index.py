# Import necessary modules from FastAPI, Pydantic, and standard libraries
from fastapi import Request
from app.infra_client.FileUtils import FileUtils
import os
from pydantic import BaseModel

# Base model for infrastructure-related requests
class InfraRequestBase(BaseModel):
    category: str  # Main category of the infrastructure item
    sub_category: str  # Sub-category for further classification
    project: str  # Project name or identifier

# Model for create/update requests, extends the base with file details
class InfraCreateUpdateRequest(InfraRequestBase):
    file_name: str  # Name of the file to create or update
    content: str  # Content to write into the file

# Response model for PUT (edit) operations
class InfraPutResponse(BaseModel):
    edited: bool  # Indicates if the file was successfully edited

# Response model for POST (create) operations
class InfraPostResponse(BaseModel):
    created: bool  # Indicates if the file was successfully created

# Response model for DELETE operations
class InfraDeleteResponse(BaseModel):
    deleted: bool  # Indicates if the file was successfully deleted

# Define the base folder where infra YAML files will be stored
base_folder = os.path.join(os.getcwd(), "infra", "infra_yaml")

# Create the base folder if it doesn't exist
if not os.path.exists(base_folder):
    os.makedirs(base_folder)

# Initialize the FileUtils helper with the base folder
utils = FileUtils(base_folder)

# GET endpoint: List files based on filters (category, sub_category, project, search_term)
async def GET(req: Request, category: str, sub_category: str, project: str = None, search_term: str = None):
    files = utils.list_files(category, sub_category, project, search_term=search_term)
    return {"files": files}

# POST endpoint: Create a new file with the given content
async def POST(req: Request, body: InfraCreateUpdateRequest) -> InfraPostResponse:
    failed = utils.create_file(body.category, body.sub_category, body.project, body.file_name, body.content)
    return {"created": not failed}

# PUT endpoint: Edit an existing file with new content
async def PUT(req: Request, body: InfraCreateUpdateRequest) -> InfraPutResponse:
    failed = utils.edit_file(body.category, body.sub_category, body.project, body.file_name, body.content)
    return {"edited": not failed}

# DELETE endpoint: Delete a specified file
async def DELETE(req: Request, category: str, sub_category: str, project: str, file_name: str) -> InfraDeleteResponse:
    failed = utils.delete_file(category, sub_category, project, file_name)
    return {"deleted": not failed}


