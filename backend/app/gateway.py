import logging
import httpx
import asyncio
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models import AuditLog, HumanReview
from app.config import settings

logger = logging.getLogger("DeepShield.Gateway")

# Set of mock external webhook endpoints. In production, these are populated dynamically from database registries.
WEBHOOK_REGISTRY: List[str] = [
    "https://security-siem.enterprise.corp/api/v1/deepfake-alerts",
    "https://compliance-audit.enterprise.corp/webhooks/synthetic-media"
]

class TieredGatewayRouter:
    """
    Reality Defender's Tiered Gateway Pattern.
    Applies strict routing based on Trust Score (TS):
    - TS < 0.3 : AUTO_REJECT + alert external SOCs via Webhooks + log high-severity alert.
    - 0.3 <= TS < 0.5 : HUMAN_REVIEW -> Route ticket to PostgreSQL human-in-the-loop audit desk.
    - TS >= 0.5 : AUTO_APPROVE -> Direct approval response.
    """
    
    @staticmethod
    async def dispatch_webhook(url: str, payload: Dict[str, Any]) -> bool:
        """
        Dispatches an HTTP POST webhook request asynchronously to security SIEM endpoints.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Webhook successfully dispatched to {url}: Status {response.status_code}")
                    return True
                else:
                    logger.warning(f"Webhook to {url} returned non-success code: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error dispatching webhook callback to {url}: {e}")
            return False

    @classmethod
    async def process_threat_alert(cls, log_entry: AuditLog) -> List[bool]:
        """
        Triggered when Trust Score falls below 0.3 threshold.
        Fires off parallel webhook callbacks to notify network operators of high-confidence synthetic media intrusion.
        """
        logger.error(
            f"SECURITY THREAT REGISTERED - file: {log_entry.file_name} "
            f"hash: {log_entry.file_hash} Trust Score: {log_entry.trust_score} (THRESHOLD < 0.3)"
        )
        
        # Prepare threat event details
        payload = {
            "event_type": "DEEPFAKE_ALERT",
            "timestamp": log_entry.created_at.isoformat() if log_entry.created_at else "",
            "file": {
                "name": log_entry.file_name,
                "hash": log_entry.file_hash,
                "type": log_entry.file_type,
                "size_bytes": log_entry.file_size_bytes
            },
            "metrics": {
                "trust_score": log_entry.trust_score,
                "action": log_entry.action_taken,
                "modality_scores": log_entry.modality_scores,
                "grounding_box": log_entry.grounding_data
            },
            "forensic_agency": "DeepShield AI Gateway"
        }
        
        # Dispatch webhooks concurrently using asyncio
        tasks = [cls.dispatch_webhook(url, payload) for url in WEBHOOK_REGISTRY]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Simple list of Boolean validation flags
        validated_dispatches = [r for r in results if isinstance(r, bool) and r]
        return validated_dispatches

    @staticmethod
    def route_to_human_queue(db: Session, log_entry: AuditLog) -> HumanReview:
        """
        Triggered when Trust Score sits inside the [0.3, 0.5) boundary.
        Creates an oversight ticket for visual analysis teams.
        """
        logger.info(f"Borderline Trust Score ({log_entry.trust_score}) routing to manual audit queue.")
        
        review_ticket = HumanReview(
            audit_log_id=log_entry.id,
            status="PENDING",
            reviewer_comments=f"Automated scan was inconclusive (TS = {log_entry.trust_score:.3f}). Awaiting verification."
        )
        
        db.add(review_ticket)
        db.commit()
        db.refresh(review_ticket)
        
        return review_ticket
