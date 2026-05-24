from fastapi import Request
from fastapi.responses import JSONResponse
from botocore.exceptions import ClientError, BotoCoreError
import logging

logger = logging.getLogger(__name__)


class AWSErrorResponse:
    @staticmethod
    def error_content(exc: Exception, region: str = None, service_name: str = None) -> dict:
        error_type = "AWS_UNKNOWN_ERROR"
        message = str(exc)
        action_required = "Contact support or check logs."

        msg = str(exc).lower()

        if isinstance(exc, ClientError):
            error_code = exc.response.get("Error", {}).get("Code", "")
            if error_code in ("AccessDenied", "UnauthorizedOperation", "AuthFailure"):
                error_type = "AWS_INSUFFICIENT_PERMISSIONS"
                message = f"AWS access denied: {error_code}"
                action_required = "Ensure your IAM user/role has the required permissions."
            elif error_code in ("InvalidAccessKeyId", "SignatureDoesNotMatch"):
                error_type = "AWS_INVALID_CREDENTIALS"
                message = f"AWS credential error: {error_code}"
                action_required = "Verify your AWS access key ID and secret access key."
            elif error_code == "BucketAlreadyExists":
                error_type = "AWS_CONFLICT"
                message = "Bucket already exists with that name"
                action_required = "Choose a different bucket name."
            elif error_code == "BucketAlreadyOwnedByYou":
                error_type = "AWS_CONFLICT"
                message = "You already own a bucket with that name"
                action_required = "Choose a different bucket name."
            elif error_code in ("DryRunOperation", "InvalidInstanceID.NotFound"):
                error_type = "AWS_NOT_FOUND"
                message = str(exc)
                action_required = "The requested resource was not found."
            elif error_code == "InstanceLimitExceeded":
                error_type = "AWS_QUOTA_EXCEEDED"
                message = "EC2 instance limit exceeded"
                action_required = "Request a service quota increase in AWS Console."
            elif error_code in ("InvalidParameterValue", "MissingParameter"):
                error_type = "AWS_INVALID_REQUEST"
                message = str(exc)
                action_required = "Check the request parameters and try again."
            elif error_code == "OptInRequired":
                error_type = "AWS_BILLING_REQUIRED"
                message = "This AWS service requires billing to be enabled"
                action_required = "Check your AWS billing settings."
        elif isinstance(exc, BotoCoreError):
            error_type = "AWS_SDK_ERROR"
            action_required = "Check network connectivity to LocalStack/AWS endpoint."

        return {
            "status": "error",
            "error_type": error_type,
            "message": str(exc),
            "action_required": action_required,
            "region": region,
            "service_name": service_name,
        }

    @staticmethod
    def handle_exception(exc: Exception, region: str = None, service_name: str = None):
        content = AWSErrorResponse.error_content(exc, region, service_name)
        status_code = {
            "AWS_INSUFFICIENT_PERMISSIONS": 403,
            "AWS_INVALID_CREDENTIALS": 401,
            "AWS_CONFLICT": 409,
            "AWS_NOT_FOUND": 404,
            "AWS_QUOTA_EXCEEDED": 429,
            "AWS_INVALID_REQUEST": 400,
            "AWS_BILLING_REQUIRED": 402,
        }.get(content["error_type"], 500)

        logger.error(f"Standardized AWS Error [{content['error_type']}]: {str(exc)}", exc_info=True)

        return JSONResponse(
            status_code=status_code,
            content={**content, "raw_details": str(exc) if status_code == 500 else None}
        )


from functools import wraps


def aws_error_interceptor(func):
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        try:
            return await func(request, *args, **kwargs)
        except (ClientError, BotoCoreError, Exception) as e:
            region = request.query_params.get("region")
            service_name = request.query_params.get("service_name")
            return AWSErrorResponse.handle_exception(e, region=region, service_name=service_name)
    return wrapper
