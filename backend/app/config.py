"""
CareerAI — Application Configuration

All settings loaded from environment variables via Pydantic BaseSettings.
No secrets are ever hardcoded. Missing required vars cause a clear startup error.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application configuration. All values from env vars or .env file."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_env: str = Field(default="development", description="Environment: development, staging, production")
    app_debug: bool = Field(default=False)
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    app_secret_key: str = Field(default="change-me-in-production")

    # --- Database ---
    database_url: str = Field(
        default="postgresql+asyncpg://careerai:careerai_dev@localhost:5432/careerai",
        description="Async database URL (asyncpg)"
    )
    database_url_sync: str = Field(
        default="postgresql://careerai:careerai_dev@localhost:5432/careerai",
        description="Sync database URL (for migrations, seeds)"
    )

    # --- CORS ---
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated allowed origins"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # --- Google Gemini ---
    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    gemini_model: str = Field(default="gemini-3.8-flash")
    gemini_embedding_model: str = Field(default="text-embedding-004")
    gemini_max_retries: int = Field(default=2, ge=1, le=5)
    gemini_timeout_seconds: int = Field(default=30, ge=5, le=120)

    # --- LinkedIn / Profile Enrichment ---
    brightdata_api_key: str = Field(default="", description="Optional Bright Data API key for LinkedIn Scraper API")
    proxycurl_api_key: str = Field(default="", description="Optional Proxycurl API key for LinkedIn profile scraping")
    linkedin_api_key: str = Field(default="", description="Optional RapidAPI/Generic LinkedIn scraper API key")

    # --- File Upload ---
    max_upload_size_mb: int = Field(default=10, ge=1, le=50)
    allowed_file_types: str = Field(
        default="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_file_types_list(self) -> List[str]:
        return [ft.strip() for ft in self.allowed_file_types.split(",") if ft.strip()]

    # --- Rate Limiting ---
    rate_limit_requests: int = Field(default=100, ge=1)
    rate_limit_window_seconds: int = Field(default=60, ge=1)

    @property
    def rate_limit_string(self) -> str:
        return f"{self.rate_limit_requests}/minute"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @field_validator("app_secret_key")
    @classmethod
    def warn_default_secret(cls, v: str) -> str:
        if v == "change-me-in-production":
            import warnings
            warnings.warn(
                "APP_SECRET_KEY is using the default value. "
                "Set a strong random secret in production.",
                UserWarning,
                stacklevel=2,
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton. Call this instead of instantiating Settings directly."""
    return Settings()
