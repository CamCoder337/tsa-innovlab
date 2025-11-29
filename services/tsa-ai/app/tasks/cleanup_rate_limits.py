"""
Cron job to cleanup old rate limit records
Run every hour to keep the table optimized

Usage:
    python -m app.tasks.cleanup_rate_limits

Cron (Linux):
    0 * * * * cd /path/to/services/tsa-ai && python -m app.tasks.cleanup_rate_limits

Docker:
    docker exec tsa-ai python -m app.tasks.cleanup_rate_limits
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.services.chatbot_function_calling_service import get_chatbot_function_calling

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def cleanup_rate_limits():
    """Cleanup old rate limit records"""
    try:
        logger.info("Starting rate limit cleanup...")
        
        chatbot = get_chatbot_function_calling()
        await chatbot._cleanup_old_rate_limits()
        
        logger.info("✅ Rate limit cleanup completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Rate limit cleanup failed: {e}", exc_info=True)
        return False


def main():
    """Main entry point"""
    success = asyncio.run(cleanup_rate_limits())
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
