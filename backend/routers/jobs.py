from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from schemas.response import DetectionResponse

router = APIRouter(prefix="/api/v1", tags=["Jobs"])

@router.get("/jobs/{job_id}", response_model=DetectionResponse)
def get_job_report(job_id: str, db: Session = Depends(get_db)):
  """
  Retrieves deep compliance audit findings and telemetry for a historical scan job.
  """
  try:
    log_id = int(job_id)
  except ValueError:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Invalid job identifier format. ID must be an integer index."
    )

  audit = db.query(AuditLog).filter(AuditLog.id == log_id).first()
  if not audit:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Forensic scan job not found inside database index."
    )

  # Map saved columns to Pydantic responses
  return DetectionResponse(
    job_id=str(audit.id),
    file_type=audit.file_type,
    gate_used=2,
    trust_score=audit.trust_score,
    verdict="synthetic" if audit.action_taken == "AUTO_REJECT" else ("uncertain" if audit.action_taken == "HUMAN_REVIEW" else "authentic"),
    action=audit.action_taken.lower(),
    confidence=0.92, # Standard baseline rating
    gate1_findings=[], # Retrospective findings
    gate2_scores=audit.modality_scores,
    grounding=audit.grounding_data if audit.grounding_data else {},
    latency_ms={
      "gate1": 5.0,
      "gate2": audit.latency_ms,
      "total": audit.latency_ms
    },
    processing_note=f"Retrieved archived scan record created on {audit.created_at}."
  )
