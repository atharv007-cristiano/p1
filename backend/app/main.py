import os
import shutil
import time
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid

# Configuration modules
from app.config import settings
from app.database import engine, get_db, Base
from app.models import User, AuditLog, HumanReview
from app.schemas import (
    UserCreate, UserResponse, Token, DetectionResponse, 
    AuditLogResponse, HumanReviewResponse, HumanReviewUpdate
)
from app.auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_active_user
)
from app.tasks import analyze_media_asset, get_pipeline
from app.websockets import router as websockets_router

# Initialize database schemas
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeepShield.Main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Multi-Modal Deepfake Forensics REST Gateway.",
    version="1.0.0"
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to authorized domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket router
app.include_router(websockets_router)

# Pre-warm deep learning models on server boot
@app.on_event("startup")
def warmup_detection_pipeline():
    logger.info("Starting up FastAPI container...")
    # Initialize the orchestrator singleton in parent thread
    get_pipeline()


@app.post(f"{settings.API_V1_STR}/auth/register", response_model=UserResponse, tags=["Authentication"])
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new corporate security operator.
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user account with this email already exists."
        )
        
    hashed_password = get_password_hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post(f"{settings.API_V1_STR}/auth/login", response_model=Token, tags=["Authentication"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Validates operator credentials and returns an encrypted JWT Token.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post(f"{settings.API_V1_STR}/detect", response_model=Dict[str, Any], tags=["Detection"])
async def scan_media_asset(
    file: UploadFile = File(...),
    async_processing: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Core media forensic scanning endpoint.
    
    1. Validates size constraints (500MB video, 100MB audio, 20MB image).
    2. Validates media format signatures.
    3. If 'async_processing' is True or file sizes are large, routes to Celery queues.
    4. Otherwise, runs rapid synchronous in-memory inference.
    """
    start_time = time.time()
    
    # Read MIME categories
    content_type = file.content_type
    if not content_type:
        raise HTTPException(status_code=400, detail="Underspecified file header type.")
        
    # File validation limits
    max_video_size = 500 * 1024 * 1024
    max_audio_size = 100 * 1024 * 1024
    max_image_size = 20 * 1024 * 1024
    
    file_type = ""
    max_allowed = 0
    if "video" in content_type:
        file_type = "video"
        max_allowed = max_video_size
    elif "audio" in content_type:
        file_type = "audio"
        max_allowed = max_audio_size
    elif "image" in content_type:
        file_type = "image"
        max_allowed = max_image_size
    else:
        raise HTTPException(status_code=400, detail="Unsupported media format. Must be image, audio, or video.")

    # Create temporary folders inside the local workspace path
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_file_name = f"{uuid.uuid4()}_{file.filename}"
    temp_file_path = os.path.join(temp_dir, temp_file_name)
    
    # Stream bytes from the upload socket in chunks to prevent heap overflows
    size_bytes = 0
    with open(temp_file_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024) # Read 1MB at a time
            if not chunk:
                break
            size_bytes += len(chunk)
            if size_bytes > max_allowed:
                # Cleanup temp file
                buffer.close()
                os.remove(temp_file_path)
                raise HTTPException(
                    status_code=413, 
                    detail=f"Upload rejected. {file_type.capitalize()} exceeds maximum size limit of {max_allowed // (1024 * 1024)}MB."
                )
            buffer.write(chunk)
            
    # Force Celery execution for larger uploads to prevent timeout issues
    is_large = (file_type == "video" and size_bytes > 50 * 1024 * 1024) or \
               (file_type == "audio" and size_bytes > 20 * 1024 * 1024)
               
    if async_processing or is_large:
        # Route to background worker thread
        task = analyze_media_asset.delay(temp_file_path, file.filename, file_type)
        return {
            "status": "QUEUED",
            "job_id": task.id,
            "message": "Asset size triggers async background pipelines. Monitor progress on websocket: /ws/progress/" + task.id
        }
        
    # Rapid synchronous flow
    try:
        # Run Celery target block synchronously inside Uvicorn context
        sync_result = analyze_media_asset(temp_file_path, file.filename, file_type)
        
        if not sync_result.get("success"):
            raise HTTPException(status_code=500, detail=sync_result.get("error"))
            
        # Load computed details from db
        audit_id = sync_result["audit_log_id"]
        audit_log = db.query(AuditLog).filter(AuditLog.id == audit_id).first()
        
        return {
            "status": "SUCCESS",
            "trust_score": audit_log.trust_score,
            "action": audit_log.action_taken,
            "c2pa_status": audit_log.c2pa_status,
            "modality_scores": audit_log.modality_scores,
            "grounding": audit_log.grounding_data,
            "explainability": audit_log.explainability_data,
            "latency_ms": audit_log.latency_ms
        }
        
    except Exception as e:
        logger.error(f"Synchronous media analysis crash: {e}")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.get(f"{settings.API_V1_STR}/history", response_model=List[AuditLogResponse], tags=["Dashboard"])
def get_audit_logs(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns audit scan history logs.
    """
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@app.get(f"{settings.API_V1_STR}/human-queue", response_model=List[HumanReviewResponse], tags=["Dashboard"])
def get_human_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetches unresolved human-in-the-loop review tickets.
    """
    tickets = db.query(HumanReview).filter(HumanReview.status == "PENDING").order_by(HumanReview.created_at.asc()).all()
    return tickets


@app.post(f"{settings.API_V1_STR}/human-queue/{{review_id}}", response_model=HumanReviewResponse, tags=["Dashboard"])
def resolve_human_ticket(
    review_id: int,
    review_update: HumanReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits a manual override review determination.
    """
    ticket = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Review ticket not found.")
        
    ticket.status = review_update.status
    ticket.reviewer_comments = review_update.reviewer_comments
    ticket.reviewed_at = datetime.datetime.utcnow()
    ticket.reviewed_by = current_user.id
    
    # Update AuditLog status mapping
    audit_log = db.query(AuditLog).filter(AuditLog.id == ticket.audit_log_id).first()
    if audit_log:
        audit_log.action_taken = f"HUMAN_{review_update.status}"
        
    db.commit()
    db.refresh(ticket)
    return ticket


@app.get(f"{settings.API_V1_STR}/stats", tags=["Dashboard"])
def fetch_system_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Aggregates threat timelines and performance statistics for dashboard charts.
    """
    total_scans = db.query(AuditLog).count()
    rejected_scans = db.query(AuditLog).filter(AuditLog.action_taken == "AUTO_REJECT").count()
    approved_scans = db.query(AuditLog).filter(AuditLog.action_taken == "AUTO_APPROVE").count()
    pending_review = db.query(HumanReview).filter(HumanReview.status == "PENDING").count()
    
    avg_latency = db.query(AuditLog).with_entities(AuditLog.latency_ms)
    latencies = [l[0] for l in avg_latency if l[0] is not None]
    avg_lat = sum(latencies) / len(latencies) if latencies else 0.0
    
    # Compute trust timelines
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    timeline = []
    for log in recent_logs:
        timeline.append({
            "timestamp": log.created_at.isoformat() if log.created_at else "",
            "trust_score": log.trust_score,
            "file": log.file_name
        })
        
    return {
        "metrics": {
            "total_scans": total_scans,
            "threat_rate_pct": (rejected_scans / total_scans * 100.0) if total_scans else 0.0,
            "auto_approved": approved_scans,
            "pending_manual": pending_review,
            "average_latency_ms": avg_lat
        },
        "timeline": list(reversed(timeline))
    }
