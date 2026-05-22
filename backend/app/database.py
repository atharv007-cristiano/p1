from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Setup standard database engine
# pool_pre_ping checks connection health before issuing queries to avoid stale sockets
# Setup database engine dynamically depending on target dialect (SQLite vs PostgreSQL)
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency injection to supply a database session per request
    and close it safely after execution completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
