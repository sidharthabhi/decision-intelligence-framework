from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL:                str = "postgresql://postgres:password@localhost:5432/di_framework"
    SECRET_KEY:                  str = "change-this-to-a-random-64-char-string-in-production"
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200   # 30 days
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 30

    model_config = {"env_file": ".env"}


settings = Settings()