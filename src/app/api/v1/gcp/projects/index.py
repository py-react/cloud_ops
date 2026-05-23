from fastapi import Request
from googleapiclient.discovery import build
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError

async def GET(request: Request):
    try:
        credential_id = request.query_params.get("credential_id")
        cred_id = int(credential_id) if credential_id and credential_id != "undefined" else None
        creds, _ = get_gcp_credentials(cred_id)

        service = build("cloudresourcemanager", "v1", credentials=creds)
        projects = service.projects().list().execute()

        return {"projects": projects.get("projects", [])}
    except GCPAuthError as e:
        return {"error": str(e)}
    except Exception as e:
        import logging
        import json
        import traceback

        # Capture full traceback in logs
        logging.error(f"GCP Projects Fetch Error: {type(e).__name__} - {str(e)}")
        logging.error(traceback.format_exc())

        error_msg = str(e)

        # Extract detailed message from Google API HttpError
        if hasattr(e, 'content'):
            try:
                error_data = json.loads(e.content.decode('utf-8'))
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass

        # If it's an HTTPException, use its detail
        if hasattr(e, 'detail'):
            error_msg = e.detail

        return {"error": error_msg or f"Internal Server Error: {type(e).__name__}"}
