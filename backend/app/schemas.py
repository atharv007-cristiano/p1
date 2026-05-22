from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

# Authentication Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# Deepfake Detection Schemas
class ModalityBreakdownSchema(BaseModel):
    visual_score: Optional[float] = None
    audio_score: Optional[float] = None
    semantic_consistency: Optional[float] = None
    behavioral_score: Optional[float] = None
    cross_modal_inconsistency_score: float
    weighed_audio_visual_sync_dtw: Optional[float] = None
    nlp_cosine_similarity: Optional[float] = None

class GroundingSchema(BaseModel):
    bbox: List[float] = Field(..., min_items=4, max_items=4)
    manipulated_audio_seconds: List[float] = Field(..., min_items=2, max_items=2)

class ExplainabilitySchema(BaseModel):
    modal_attribution: Dict[str, float]
    rollout_matrix: Optional[List[List[float]]] = None

class DetectionResponse(BaseModel):
    success: bool
    provenance_verified: bool
    bypass_inference: bool
    trust_score: float
    status_code: str
    action: str # AUTO_APPROVE, AUTO_REJECT, HUMAN_REVIEW
    message: str
    modality_breakdown: ModalityBreakdownSchema
    grounding: GroundingSchema
    explainability: ExplainabilitySchema


# Audit & Review Schemas
class AuditLogResponse(BaseModel):
    id: int
    file_name: str
    file_hash: str
    file_type: str
    file_size_bytes: int
    c2pa_status: str
    trust_score: float
    action_taken: str
    modality_scores: Dict[str, Any]
    grounding_data: Optional[Dict[str, Any]] = None
    explainability_data: Optional[Dict[str, Any]] = None
    latency_ms: float
    created_at: datetime

    class Config:
        from_attributes = True

class HumanReviewUpdate(BaseModel):
    status: str # APPROVED, REJECTED
    reviewer_comments: Optional[str] = None

class HumanReviewResponse(BaseModel):
    id: int
    audit_log_id: int
    status: str
    reviewer_comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    audit_log: AuditLogResponse

    class Config:
        from_attributes = True
