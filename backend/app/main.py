import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.neo4j import neo4j_db
from app.db.postgresql import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: connect to databases
    logger.info("Starting NextStep API...")
    await engine.connect()
    await neo4j_db.connect()
    logger.info("Connected to databases")

    yield

    # Shutdown: disconnect from databases
    await engine.dispose()
    await neo4j_db.disconnect()
    logger.info("NextStep API shutdown complete")


app = FastAPI(
    title="NextStep API",
    description="AI-powered learning path generation",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import auth, paths, skills, content, admin

app.include_router(auth.router)
app.include_router(paths.router)
app.include_router(skills.router)
app.include_router(content.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "nextstep-api"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
