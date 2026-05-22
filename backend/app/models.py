import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    """
    User Account model for secure Dashboard access.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    """
    AuditLog model detailing deepfake analysis results for security compliance.
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_hash = Column(String, index=True, nullable=False)
    file_type = Column(String, nullable=False) # video, audio, image
    file_size_bytes = Column(Integer, nullable=False)
    
    c2pa_status = Column(String, nullable=False) # authentic, tampered, absent, error
    trust_score = Column(Float, nullable=False)
    action_taken = Column(String, nullable=False) # AUTO_APPROVE, AUTO_REJECT, HUMAN_REVIEW
    
    # Modality and pipeline scores in JSON
    modality_scores = Column(JSON, nullable=False)
    grounding_data = Column(JSON, nullable=True) # bbox & timestamp segments
    explainability_data = Column(JSON, nullable=True) # SHAP modalities contributions
    
    latency_ms = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to HumanReview if applicable
    review = relationship("HumanReview", back_populates="audit_log", uselist=False)


class HumanReview(Base):
    """
    HumanReview model for human-in-the-loop oversight on suspicious borderline cases (0.3 <= TS < 0.5).
    """
    __tablename__ = "human_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_log_id = Column(Integer, ForeignKey("audit_logs.id"), nullable=False)
    
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    reviewer_comments = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    audit_log = relationship("AuditLog", back_populates="review")
