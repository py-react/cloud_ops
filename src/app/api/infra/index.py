from fastapi import Request
from app.infra_client.FileUtils import FileUtils
import os
from pydantic import BaseModel

class InfraRequestBase(BaseModel):
    category: str
    sub_category: str
    project: str

class InfraCreateUpdateRequest(InfraRequestBase):
    file_name:str
    content:str

class InfraPutResponse(BaseModel):
    edited: bool

class InfraPostResponse(BaseModel):
    created: bool

class InfraDeleteResponse(BaseModel):
    deleted: bool

base_folder = os.path.join(os.getcwd(),"infra_data")

if not os.path.exists(base_folder):
    os.makedirs(base_folder)

utils = FileUtils(base_folder)



async def GET(req:Request,category:str,sub_category:str,project:str=None,search_term:str=None):
    files = utils.list_files(category, sub_category, project, search_term=search_term)
    return {"files":files}

async def POST(req:Request,body:InfraCreateUpdateRequest)->InfraPostResponse:
    failed = utils.create_file(body.category, body.sub_category, body.project,body.file_name, body.content)
    return {"created":not failed}

async def PUT(req:Request,body:InfraCreateUpdateRequest)->InfraPutResponse:
    failed = utils.edit_file(body.category, body.sub_category, body.project,body.file_name, body.content)
    return {"edited":not failed}

async def DELETE(req:Request,category:str,sub_category:str,project:str,file_name:str)->InfraDeleteResponse:
    failed = utils.delete_file(category, sub_category, project,file_name)
    return {"deleted":not failed}


