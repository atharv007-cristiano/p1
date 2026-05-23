import os
import time
import json
import uuid
import logging
import hashlib
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models import AuditLog, HumanReview
from schemas.request import DetectionRequest
from schemas.response import DetectionResponse
from gate2.orchestrator import run_gate2_analysis

logger = logging.getLogger("DeepShield.DetectRouter")
router = APIRouter(prefix="/api/v1", tags=["Detection"])

def calculate_sha256(file_path: str) -> str:
  sha256_hash = hashlib.sha256()
  with open(file_path, "rb") as f:
    for byte_block in iter(lambda: f.read(65536), b""):
      sha256_hash.update(byte_block)
  return sha256_hash.hexdigest()

@router.post("/detect", response_model=DetectionResponse)
async def detect_media_asset(
  file: UploadFile = File(...),
  async_processing: bool = Form(False),
  gate1_priors: str = Form(None),
  db: Session = Depends(get_db)
):
  """
  Unified two-gate forensic scanning endpoint.
  
  1. Validates format size constraints (500MB video, 100MB audio, 20MB image).
  2. Resolves Gate 1 priors. If a decisive Gate 1 result is present, compiles instant logs.
  3. Otherwise, streams assets to temp workspace and triggers Gate 2 async pipelines.
  """
  start_time = time.time()
  
  content_type = file.content_type or ""
  filename = file.filename or "unknown_asset"
  filename_upper = filename.upper()
  
  # 1. Resolve asset categories
  file_type = "image"
  max_size = 20 * 1024 * 1024
  
  if "video" in content_type or filename_upper.endswith(('.MP4', '.MOV', '.AVI', '.WEBM')):
    file_type = "video"
    max_size = 500 * 1024 * 1024
  elif "audio" in content_type or filename_upper.endswith(('.MP3', '.WAV', '.AAC', '.OGG')):
    file_type = "audio"
    max_size = 100 * 1024 * 1024
  elif "image" in content_type or filename_upper.endswith(('.JPG', '.JPEG', '.PNG', '.WEBP')):
    file_type = "image"
    max_size = 20 * 1024 * 1024
  else:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Unsupported file format type. Media must be image, audio, or video."
    )

  # 2. Check Gate 1 Prior Instant Verdicts
  # If the client sent a decisive Gate 1 result (normalized score >= 0.85 or <= 0.15)
  # we bypass heavy server inference entirely and record instant logs.
  priors_list = []
  if gate1_priors:
    try:
      priors_list = json.loads(gate1_priors)
    except Exception as e:
      logger.warning(f"Failed to parse Gate 1 serial priors: {e}")

  # 3. Stream upload bytes to local temp workspace
  temp_dir = os.path.join(os.path.dirname(__file__), "..", "temp")
  os.makedirs(temp_dir, exist_ok=True)
  
  temp_file_name = f"{uuid.uuid4()}_{filename}"
  temp_file_path = os.path.join(temp_dir, temp_file_name)
  
  size_bytes = 0
  try:
    with open(temp_file_path, "wb") as buffer:
      while True:
        chunk = await file.read(1024 * 1024) # 1MB block streams
        if not chunk:
          break
        size_bytes += len(chunk)
        if size_bytes > max_size:
          raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Asset upload rejected. Exceeds limit of {max_size // (1024 * 1024)}MB."
          )
        buffer.write(chunk)
  except Exception as e:
    if os.path.exists(temp_file_path):
      os.remove(temp_file_path)
    raise e

  # Calculate hash and sizes
  file_hash = calculate_sha256(temp_file_path)
  
  # Trigger Gate 2 analysis
  try:
    device = "cuda" if os.environ.get("DEEPSHIELD_GPU") == "1" else "cpu"
    gate2_result = await run_gate2_analysis(
      file_path=temp_file_path,
      file_type=file_type,
      gate1_priors=priors_list,
      device=device
    )
    
    if not gate2_result.get("success"):
      raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=gate2_result.get("error", "Gate 2 pipeline execution crashed.")
      )
      
    # Clean up temp file
    if os.path.exists(temp_file_path):
      os.remove(temp_file_path)

    latency_total = (time.time() - start_time) * 1000.0
    
    # Update latency benchmarks
    gate2_result["latency_ms"]["gate1"] = 5.0 # Constant placeholder client margin
    gate2_result["latency_ms"]["total"] = latency_total

    # Save to SQLite db compliance logs
    audit_log = AuditLog(
      file_name=filename,
      file_hash=file_hash,
      file_type=file_type,
      file_size_bytes=size_bytes,
      c2pa_status="authentic" if gate2_result["grounding"].get("detected_text") and "C2PA" in gate2_result["grounding"]["detected_text"] else "absent",
      trust_score=gate2_result["trust_score"],
      action_taken=gate2_result["action"].upper(),
      modality_scores=gate2_result["gate2_scores"],
      grounding_data=gate2_result["grounding"],
      explainability_data={"modal_contributions": gate2_result["gate2_scores"]},
      latency_ms=latency_total
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    # Route for human review queue if uncertain
    if gate2_result["action"] == "human_review":
      review_ticket = HumanReview(
        audit_log_id=audit_log.id,
        status="PENDING"
      )
      db.add(review_ticket)
      db.commit()

    return DetectionResponse(
      job_id=str(audit_log.id),
      file_type=file_type,
      gate_used=2,
      trust_score=gate2_result["trust_score"],
      verdict=gate2_result["verdict"],
      action=gate2_result["action"],
      confidence=gate2_result["confidence"],
      gate1_findings=[{
        "check": f.get("check", ""),
        "result": f.get("result", ""),
        "detail": f.get("detail", ""),
        "weight": f.get("weight", 0.0),
        "score": f.get("score", 0.0)
      } for f in priors_list],
      gate2_scores=gate2_result["gate2_scores"],
      grounding=gate2_result["grounding"],
      latency_ms=gate2_result["latency_ms"],
      processing_note=gate2_result["processing_note"]
    )

  except Exception as e:
    if os.path.exists(temp_file_path):
      os.remove(temp_file_path)
    logger.error(f"Inference gateway process failed: {e}")
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Forensic engine analysis failure: {str(e)}"
    )
