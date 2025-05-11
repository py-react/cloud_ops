from pydantic import BaseModel
from typing import Optional,Tuple


class CreateContextUserData(BaseModel):
    token:Optional[str] = None
    client_certificate_data:Optional[str]= None
    client_key_data:Optional[str]= None
    username:Optional[str]
    password:Optional[str]


class CreateContextClusterData(BaseModel):
    server:str
    certificate_authority_data:Optional[str]= None
    insecure_skip_tls_verify:Optional[bool]= False

class CreateContextData(BaseModel):
    name:str
    cluster:CreateContextClusterData
    user:CreateContextUserData
    namesapce:Optional[str]="default"
    set_current:Optional[bool]=False
    config_file:Optional[str]="~/.kuber/config"