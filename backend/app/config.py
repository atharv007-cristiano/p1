import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Global configuration settings loaded from environment variables or defaults.
    """
    PROJECT_NAME: str = "DeepShield: Multimodal Deepfake Forensics"
    API_V1_STR: str = "/api/v1"
    
    # JWT authentication parameters
    SECRET_KEY: str = os.getenv("DEEPSHIELD_SECRET_KEY", "7b94924c568f237efb7c6ee9b74052f6b8969ea2dfdf9037c22998a4da07ea62")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 Hours
    
    # SQLite / PostgreSQL selection parameters
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "True").lower() == "true"
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "deepshield_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            # Place deepshield.db inside backend/ directory
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            return f"sqlite:///{os.path.join(backend_dir, 'deepshield.db')}"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    # Redis parameters (Celery and WebSocket state)
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: str = os.getenv("REDIS_PORT", "6379")
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    class Config:
        case_sensitive = True

settings = Settings()
