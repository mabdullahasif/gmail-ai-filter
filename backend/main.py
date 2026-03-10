import asyncio
import os
from filter_logic import process_emails_async

# CLI version for backward compatibility
# You can still run the filter via: python main.py

async def log_progress(current, total, msg):
    print(f"[{current}/{total}] {msg}")

async def run_cli():
    # Load from environment or code
    EMAIL = os.getenv("GMAIL_EMAIL", "")
    PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
    
    print("🚀 Starting Gmail Filter (CLI Mode)")
    await process_emails_async(EMAIL, PASSWORD, log_progress)
    print("✅ Filter Process Complete!")

if __name__ == "__main__":
    asyncio.run(run_cli())
