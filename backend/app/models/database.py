"""
CareerAI — Database Connection & Session Management

Uses SQLAlchemy async engine with asyncpg driver.
Session is injected via FastAPI's Depends() for clean request-scoped lifecycle.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from app.config import get_settings

settings = get_settings()


def get_async_database_url(raw_url: str) -> str:
    """Normalize database connection string for SQLAlchemy asyncpg engine (supporting Neon URLs)."""
    url = raw_url.strip()
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    # asyncpg does not take channel_binding in URL query parameters
    qs.pop("channel_binding", None)
    # Convert sslmode to ssl for asyncpg
    if "sslmode" in qs:
        qs["ssl"] = qs.pop("sslmode")

    new_query = urlencode({k: v[0] for k, v in qs.items()})
    return urlunparse(parsed._replace(query=new_query))


# Async engine — connection pool managed by SQLAlchemy
engine = create_async_engine(
    get_async_database_url(settings.database_url),
    echo=settings.app_debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # verify connections before checkout
    pool_recycle=3600,    # recycle connections after 1 hour
)

# Session factory — produces request-scoped async sessions
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async database session.
    Session is automatically closed after the request completes.

    Usage in route:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """Verify database connectivity. Used by /health endpoint."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def dispose_engine() -> None:
    """Cleanup engine on shutdown."""
    await engine.dispose()
