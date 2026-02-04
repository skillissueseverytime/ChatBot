"""Application configuration."""
import os

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./controlled_anonymity.db")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Karma settings
KARMA_INITIAL = 100
KARMA_CHAT_COMPLETE = 2
KARMA_REPORTED = -15
KARMA_REPORT_VERIFIED = -30
KARMA_FALSE_REPORT = -10
KARMA_DAILY_LOGIN = 1

# Karma thresholds
KARMA_FULL_ACCESS = 100
KARMA_STANDARD_ACCESS = 50
KARMA_WARNING = 25
KARMA_TEMP_BAN = 25
KARMA_PERMANENT_BAN = 0

# Rate limits
DAILY_SPECIFIC_FILTER_LIMIT = 5
QUEUE_COOLDOWN_SECONDS = 10

# CORS - Allow all localhost ports during development
# CORS - Allow all localhost ports during development
CORS_ORIGINS = ["*"]

# Demo Mode - Disables ML verification for lightweight deployment
DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() == "true"

