from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """
    Health check endpoint returning system operational status.
    Must return exact JSON payload required by spec:
    {
        "status": "ok",
        "service": "traceback-engine"
    }
    """
    return {
        "status": "ok",
        "service": "traceback-engine"
    }
