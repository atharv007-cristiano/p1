from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Gate1PriorFinding(BaseModel):
  check: str
  result: str
  detail: str
  weight: float
  score: float

class DetectionRequest(BaseModel):
  async_processing: Optional[bool] = Field(default=False, description="Enable Celery queuing for asynchronous long-running scans.")
  gate1_priors: Optional[str] = Field(default=None, description="Serialized JSON string containing Gate 1 pre-filter findings.")
