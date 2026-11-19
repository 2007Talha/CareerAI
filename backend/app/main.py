"""
CareerAI — FastAPI Application Entry Point

Sets up the app with CORS, rate limiting, structured logging,
route registration, startup/shutdown hooks, and health check.
"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.models.database import check_db_connection, dispose_engine
from app.models.schemas import HealthResponse, ErrorResponse
from app.utils.logging import setup_logging, get_logger, request_id_ctx

settings = get_settings()
logger = get_logger(__name__)


# =============================================================================
# Lifespan — startup and shutdown hooks
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown tasks."""
    # Startup
    setup_logging()
    logger.info("careerai_starting", env=settings.app_env, debug=settings.app_debug)

    db_ok = await check_db_connection()
    if db_ok:
        logger.info("database_connected")
    else:
        logger.warning("database_connection_failed", detail="App will start but DB operations will fail")

    yield

    # Shutdown
    logger.info("careerai_shutting_down")
    await dispose_engine()


# =============================================================================
# App Instance
# =============================================================================

app = FastAPI(
    title="CareerAI",
    description="AI-powered career readiness assessment platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)


# =============================================================================
# Rate Limiting
# =============================================================================

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# =============================================================================
# CORS Middleware
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
    max_age=600,  # preflight cache: 10 minutes
)


# =============================================================================
# Request ID Middleware
# =============================================================================

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Assign a unique request ID for log correlation."""
    rid = str(uuid.uuid4())[:8]
    request_id_ctx.set(rid)
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


# =============================================================================
# Global Exception Handler
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch unhandled exceptions. Log the full traceback server-side,
    but return a safe message to the client (no stack traces in production).
    """
    logger.error(
        "unhandled_exception",
        error=str(exc),
        path=str(request.url),
        method=request.method,
        exc_info=exc,
    )

    detail = str(exc) if settings.app_debug else "An internal error occurred."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=detail,
            status_code=500,
        ).model_dump(),
    )


# =============================================================================
# Health Check
# =============================================================================

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["system"],
    summary="Health check",
)
async def health_check():
    """Verify the service is running and database is reachable."""
    db_connected = await check_db_connection()
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        database=db_connected,
    )


# =============================================================================
# Route Registration
# Import and include route modules here as they are built.
# =============================================================================

from app.api import upload, profiles, ranking, careers, coach, progress  # noqa: E402

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(profiles.router, prefix="/api", tags=["profiles"])
app.include_router(ranking.router, prefix="/api", tags=["ranking"])
app.include_router(careers.router, prefix="/api", tags=["careers"])
app.include_router(coach.router, prefix="/api", tags=["coach"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
