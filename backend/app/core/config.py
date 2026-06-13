from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://radar_user:radar_password@postgres:5432/radar_db"
    SEED_ON_STARTUP: bool = True
    CMC_API_KEY: str | None = None
    CMC_REFRESH_INTERVAL_SECONDS: int = 55


settings = Settings()
