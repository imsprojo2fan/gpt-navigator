import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# Request settings
REQUEST_DELAY_MIN = 1.0
REQUEST_DELAY_MAX = 3.0
REQUEST_TIMEOUT = 30
