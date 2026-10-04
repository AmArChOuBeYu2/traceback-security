from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.investigation import router as investigation_router
from api.engine_router import router as engine_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TRACEBACK - Evidence-linked security log investigation platform engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(investigation_router)
app.include_router(engine_router)


@app.get("/")
def root():
    return {
        "service": "TRACEBACK Engine",
        "status": "operational",
        "health_check": "/health",
        "detection_api": "/api/engine/detect-and-correlate",
    }
