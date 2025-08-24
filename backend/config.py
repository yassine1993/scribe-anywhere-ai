import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Scribe Anywhere API"
    secret_key: str = os.getenv("SECRET_KEY", "changeme")
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_dummy")
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")


settings = Settings()
