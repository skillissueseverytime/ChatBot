"""
Matching service using Redis for real-time queue management.
"""
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# In-memory fallback when Redis is not available
_memory_queues: Dict[str, list] = {
    "male": [],
    "female": [],
    "any": [],
}
_active_matches: Dict[str, str] = {}  # device_id -> partner_device_id


class MatchingService:
    """Handles user matching with queue-based system."""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.use_memory = redis_client is None
        
    async def add_to_queue(
        self,
        device_id: str,
        gender: str,
        looking_for: str  # "male", "female", or "any"
    ) -> bool:
        """
        Add user to matching queue.
        Returns True if added successfully.
        """
        # Normalize gender to match queue names (male/female)
        normalized_gender = gender.lower()
        if normalized_gender == "man":
            normalized_gender = "male"
        elif normalized_gender == "woman":
            normalized_gender = "female"
        
        queue_entry = {
            "device_id": device_id,
            "gender": normalized_gender,
            "looking_for": looking_for.lower(),
            "joined_at": datetime.utcnow().isoformat(),
        }
        
        if self.use_memory:
            # In-memory queue
            queue_name = normalized_gender
            if queue_name not in _memory_queues:
                queue_name = "any"
            _memory_queues[queue_name].append(queue_entry)
            logger.info(f"Added {device_id} to memory queue: {queue_name}")
            return True
        else:
            # Redis queue
            queue_key = f"queue:{gender.lower()}"
            await self.redis.lpush(queue_key, json.dumps(queue_entry))
            # Set expiry on queue entry (auto-cleanup after 5 minutes)
            await self.redis.expire(queue_key, 300)
            return True
    
    
    async def remove_from_queue(self, device_id: str, gender: str) -> bool:
        """Remove user from their queue."""
        # Normalize gender to match queue names
        normalized_gender = gender.lower()
        if normalized_gender == "man":
            normalized_gender = "male"
        elif normalized_gender == "woman":
            normalized_gender = "female"
        
        if self.use_memory:
            queue_name = normalized_gender
            if queue_name in _memory_queues:
                _memory_queues[queue_name] = [
                    e for e in _memory_queues[queue_name]
                    if e["device_id"] != device_id
                ]
            return True
        else:
            # Redis removal (scan and remove)
            queue_key = f"queue:{normalized_gender}"
            entries = await self.redis.lrange(queue_key, 0, -1)
            for entry in entries:
                data = json.loads(entry)
                if data["device_id"] == device_id:
                    await self.redis.lrem(queue_key, 1, entry)
                    return True
            return False
    
    async def find_match(
        self,
        device_id: str,
        my_gender: str,
        looking_for: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find a matching partner from the queue.
        
        Matching logic:
        - If looking_for is specific: search in that gender's queue for someone looking for my gender
        - If looking_for is "any": search all queues for someone looking for my gender or "any"
        
        Both users must be compatible:
        - I'm looking for their gender (or any)
        - They're looking for my gender (or any)
        """
        # Normalize my_gender to match queue data (man/woman -> male/female)
        my_gender_lower = my_gender.lower()
        if my_gender_lower == "man":
            my_gender_lower = "male"
        elif my_gender_lower == "woman":
            my_gender_lower = "female"
        
        target_gender = looking_for.lower() if looking_for.lower() != "any" else None
        
        print(f"\n🔍 [MATCH] Searching for match:")
        print(f"   Device: {device_id[:12]}...")
        print(f"   My gender: {my_gender_lower}")
        print(f"   Looking for: {looking_for}")
        print(f"   Target gender: {target_gender}")
        print(f"   Queue stats: {self.get_queue_stats()}")
        
        logger.info(f"[MATCH] {device_id[:8]}... ({my_gender_lower}) looking for {looking_for}")
        logger.info(f"[MATCH] Current queues: {self.get_queue_stats()}")
        
        if self.use_memory:
            # Search in-memory queues
            candidates = []
            
            if target_gender:
                # Looking for specific gender - search THAT gender's queue
                candidates = list(_memory_queues.get(target_gender, []))
                print(f"   Searching {target_gender} queue: {len(candidates)} candidates")
                logger.info(f"[MATCH] Searching {target_gender} queue: {len(candidates)} candidates")
            else:
                # Looking for any - search all queues
                for queue in _memory_queues.values():
                    candidates.extend(queue)
                print(f"   Searching all queues: {len(candidates)} total candidates")
                logger.info(f"[MATCH] Searching all queues: {len(candidates)} total candidates")
            
            # Find compatible match - mutual compatibility check
            for idx, candidate in enumerate(candidates):
                print(f"\n   Candidate {idx + 1}: {candidate['device_id'][:12]}...")
                
                if candidate["device_id"] == device_id:
                    print(f"   ❌ Skipping self")
                    logger.info(f"[MATCH] Skipping self")
                    continue
                
                candidate_gender = candidate["gender"]
                their_pref = candidate["looking_for"]
                
                # Check mutual compatibility:
                # 1. I'm ok with their gender (target_gender matches or I want any)
                i_want_them = (target_gender is None or candidate_gender == target_gender)
                # 2. They're ok with my gender (they want my gender or any)
                they_want_me = (their_pref == "any" or their_pref == my_gender_lower)
                
                print(f"   Gender: {candidate_gender}, Looking for: {their_pref}")
                print(f"   i_want_them: {i_want_them} (target={target_gender}, candidate_gender={candidate_gender})")
                print(f"   they_want_me: {they_want_me} (their_pref={their_pref}, my_gender={my_gender_lower})")
                
                logger.info(f"[MATCH] Candidate {candidate['device_id'][:8]}... ({candidate_gender}, wants {their_pref})")
                logger.info(f"[MATCH] i_want_them={i_want_them}, they_want_me={they_want_me}")
                
                if i_want_them and they_want_me:
                    print(f"   ✅ MATCH FOUND!")
                    logger.info(f"[MATCH] SUCCESS! Matched with {candidate['device_id'][:8]}...")
                    # Remove from queue
                    await self.remove_from_queue(
                        candidate["device_id"],
                        candidate["gender"]
                    )
                    
                    # Store active match
                    _active_matches[device_id] = candidate["device_id"]
                    _active_matches[candidate["device_id"]] = device_id
                    
                    return candidate
                else:
                    print(f"   ❌ Not compatible")
            
            print(f"\n❌ No match found\n")
            logger.info(f"[MATCH] No match found for {device_id[:8]}...")
            return None
        else:
            # Redis-based matching
            search_queues = (
                [f"queue:{target_gender}"] if target_gender
                else ["queue:male", "queue:female"]
            )
            
            for queue_key in search_queues:
                entries = await self.redis.lrange(queue_key, 0, -1)
                for entry in entries:
                    candidate = json.loads(entry)
                    if candidate["device_id"] == device_id:
                        continue
                    
                    their_pref = candidate["looking_for"]
                    if their_pref == "any" or their_pref == my_gender.lower():
                        # Remove from queue
                        await self.redis.lrem(queue_key, 1, entry)
                        
                        # Store match in Redis
                        match_key = f"match:{device_id}"
                        await self.redis.set(
                            match_key,
                            candidate["device_id"],
                            ex=3600  # 1 hour expiry
                        )
                        
                        return candidate
            
            return None
    
    async def get_current_match(self, device_id: str) -> Optional[str]:
        """Get the current match partner's device ID."""
        if self.use_memory:
            return _active_matches.get(device_id)
        else:
            match_key = f"match:{device_id}"
            return await self.redis.get(match_key)
    
    async def end_match(self, device_id: str) -> bool:
        """End the current match."""
        if self.use_memory:
            partner_id = _active_matches.pop(device_id, None)
            if partner_id:
                _active_matches.pop(partner_id, None)
            return True
        else:
            match_key = f"match:{device_id}"
            partner_id = await self.redis.get(match_key)
            if partner_id:
                await self.redis.delete(match_key)
                await self.redis.delete(f"match:{partner_id}")
            return True
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Get current queue sizes (for debugging)."""
        if self.use_memory:
            return {k: len(v) for k, v in _memory_queues.items()}
        return {}


# Global instance (can be overridden with Redis client)
matching_service = MatchingService()
