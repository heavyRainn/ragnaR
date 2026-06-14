from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://radar_user:radar_password@postgres:5432/radar_db"
    SEED_ON_STARTUP: bool = True
    CMC_API_KEY: str | None = None
    CMC_LISTINGS_LIMIT: int = 50
    # Min 60s — one listings/latest call per tick (~1 CMC credit). Do not set lower.
    CMC_SYNC_INTERVAL_SECONDS: int = 60
    # Deprecated alias — falls back when unset in older .env files
    CMC_REFRESH_INTERVAL_SECONDS: int | None = None

    @property
    def cmc_sync_interval(self) -> int:
        if self.CMC_REFRESH_INTERVAL_SECONDS is not None:
            raw = self.CMC_REFRESH_INTERVAL_SECONDS
        else:
            raw = self.CMC_SYNC_INTERVAL_SECONDS
        # Never sync faster than once per minute — protects CMC credit budget.
        return max(60, raw)

    @property
    def is_live_data(self) -> bool:
        return bool(self.CMC_API_KEY and self.CMC_API_KEY.strip())


settings = Settings()
