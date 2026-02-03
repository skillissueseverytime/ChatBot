"""
Debug endpoints for troubleshooting
"""
from fastapi import APIRouter
from app.services.matching import matching_service, _memory_queues

router = APIRouter()

@router.get("/debug/queues")
async def get_queue_state():
    """Get current queue state and user stats for debugging"""
    from app.routers.ws_chat import manager
    
    online_count = len(manager.active_connections)
    # active_chats stores specific pairings twice (A->B, B->A), so we divide by 2 for unique chats
    # However for 'Active Chats' display usually total people in chat is fine, or pairs. 
    # Let's count unique pairs or just return total active chat sessions.
    # Actually, let's just use len(active_chats) // 2 for unique conversations.
    active_chat_pairs = len(manager.active_chats) // 2

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
        "stats": matching_service.get_queue_stats(),
        "online_users": online_count,
        "active_chats": active_chat_pairs
    }
