from app.docker_client import clientContext
from fastapi import Request
from pydantic import BaseModel
from typing import Optional,Literal,List, Dict,Any

client = clientContext.client

async def GET(request:Request):
    networks = client.networks.list()
    network_info = []
    for network in networks:
        try:
            network_info.append(network.attrs)
        except Exception as e:
            print("".format(e))
    return {"items":network_info}