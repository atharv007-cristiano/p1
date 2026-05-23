import os
import sys
from celery import Celery

# Add parent directory to path to allow correct resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

celery_app = Celery(
  "deepshield_workers",
  broker=settings.REDIS_URL,
  backend=settings.REDIS_URL
)

celery_app.conf.update(
  task_serializer="json",
  accept_content=["json"],
  result_serializer="json",
  timezone="UTC",
  enable_utc=True,
  worker_prefetch_multiplier=1
)

@celery_app.task(name="workers.process_async_forensics")
def process_async_forensics(file_path: str, file_type: str, priors_json: str):
  """
  Celery task queue runner that executes full Gate 2 deep forensics on large files 
  offline, saving results directly to compliance tables.
  """
  import asyncio
  import json
  from app.database import SessionLocal
  from app.models import AuditLog
  from gate2.orchestrator import run_gate2_analysis
  
  priors = []
  if priors_json:
    try:
      priors = json.loads(priors_json)
    except Exception:
      pass
      
  # Run async pipeline inside thread loop context
  loop = asyncio.get_event_loop()
  res = loop.run_until_complete(
    run_gate2_analysis(
      file_path=file_path,
      file_type=file_type,
      gate1_priors=priors
    )
  )
  
  # Clean up file
  if os.path.exists(file_path):
    try:
      os.remove(file_path)
    except Exception:
      pass
      
  return res
