"""
Debug endpoints for troubleshooting
"""
from fastapi import APIRouter
from app.services.matching import matching_service, _memory_queues

router = APIRouter()

@router.get("/debug/queues")
async def get_queue_state():
    """Get current queue state for debugging"""
    return {
        "queues": {
            "male": [
                {
                    "device_id": q["device_id"][:12] + "...",
                    "gender": q["gender"],
                    "looking_for": q["looking_for"]
                }
                for q in _memory_queues.get("male", [])
            ],
            "female": [
                {
                    "device_id": q["device_id"][:12] + "...",
                    "gender": q["gender"],
                    "looking_for": q["looking_for"]
                }
                for q in _memory_queues.get("female", [])
            ],
            "any": [
                {
                    "device_id": q["device_id"][:12] + "...",
                    "gender": q["gender"],
                    "looking_for": q["looking_for"]
                }
                for q in _memory_queues.get("any", [])
            ],
        },
        "stats": matching_service.get_queue_stats()
    }
