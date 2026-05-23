from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class FindingSchema(BaseModel):
  check: str
  result: str
  detail: str
  weight: float
  score: float

class Gate2ScoresSchema(BaseModel):
  srm: Optional[float] = None
  frequency: Optional[float] = None
  ela: Optional[float] = None
  gan_cnn: Optional[float] = None
  face_consistency: Optional[float] = None
  rppg: Optional[float] = None
  temporal: Optional[float] = None
  lipsync: Optional[float] = None
  byte_integrity: Optional[float] = None
  spectral: Optional[float] = None
  prosodic: Optional[float] = None
  rawnet3: Optional[float] = None

class GroundingSchema(BaseModel):
  face_bbox: Optional[List[float]] = None
  manipulation_heatmap_url: Optional[str] = None
  audio_segment_ms: Optional[List[float]] = None
  detected_text: Optional[List[str]] = None

class LatencySchema(BaseModel):
  gate1: float
  gate2: float
  total: float

class DetectionResponse(BaseModel):
  job_id: str
  file_type: str = Field(..., description="File modality category: image, video, or audio.")
  gate_used: int = Field(..., description="The verification gate boundary resolved: 1 or 2.")
  trust_score: float = Field(..., description="Aggregated liveness trust probability [0.0 - 1.0].")
  verdict: str = Field(..., description="Forensic resolution determination: authentic, synthetic, or uncertain.")
  action: str = Field(..., description="Automated security pipeline routing action.")
  confidence: float = Field(..., description="Statistical confidence bounds of verdict.")
  gate1_findings: List[FindingSchema] = Field(default=[], description="Browser-side checklist findings.")
  gate2_scores: Gate2ScoresSchema = Field(..., description="Granular scores attribution across Gate 2 modules.")
  grounding: GroundingSchema = Field(..., description="Spatial and temporal coordinates pointing to manipulation source zones.")
  latency_ms: LatencySchema = Field(..., description="Detailed execution profiling benchmarks.")
  processing_note: str = Field(..., description="Explanatory text tracing the forensic decisions.")
