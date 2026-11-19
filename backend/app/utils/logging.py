"""
CareerAI — Structured Logging

JSON-formatted logs with request ID correlation for tracing.
Uses structlog for consistent, machine-parseable log output.
"""

import uuid
import logging
import sys
from contextvars import ContextVar
from typing import Optional

import structlog

from app.config import get_settings

# Context variable for request-scoped correlation ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def get_request_id() -> str:
    """Get current request ID or generate a new one."""
    rid = request_id_ctx.get()
    if rid is None:
        rid = str(uuid.uuid4())[:8]
        request_id_ctx.set(rid)
    return rid


def add_request_id(logger, method_name, event_dict):
    """structlog processor: inject request_id into every log entry."""
    rid = request_id_ctx.get()
    if rid:
        event_dict["request_id"] = rid
    return event_dict


def setup_logging() -> None:
    """
    Configure structured logging for the application.
    In production: JSON output.
    In development: colored console output.
    """
    settings = get_settings()

    # Shared processors for both dev and prod
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        add_request_id,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.is_production:
        # Production: JSON logs for machine parsing
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: readable colored console logs
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging to use structlog
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO if settings.is_production else logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    root_logger.addHandler(handler)

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.WARNING if settings.is_production else logging.INFO
    )


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """Get a named logger instance."""
    return structlog.get_logger(name)
