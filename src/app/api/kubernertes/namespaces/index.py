from fastapi import Request

async def GET(request: Request):
    return {"status": "success", "message": "Namespaces API root"}
