import json
import logging
import re
from anthropic import Anthropic
from config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None:
        if not ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not set in .env")
        _client = Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client

PARSE_PROMPT = """Extract information about this "get paid to" / GPT (get-paid-to) platform from the website content below.
Return ONLY valid JSON, no other text. Use this exact structure:

{
  "name": "Platform name",
  "description": "One-sentence English description (max 50 words)",
  "min_cashout": "Minimum cashout amount like $1.00 or null if unknown",
  "payment_methods": ["paypal", "crypto", "giftcard", "bank", "venmo"],
  "task_types": ["survey", "games", "app", "video", "referral", "shopping"],
  "regions": ["US", "UK", "CA", "AU", "Global"],
  "has_mobile_app": true
}

Rules:
- Only include payment_methods / task_types / regions that the website mentions or clearly implies
- If the website content doesn't contain relevant platform information, return {"error": "no platform info found"}
- Use null for unknown fields, never make up values

Website content:
{html}
"""


def parse_html(html: str) -> dict:
    """
    Send HTML content to Claude and get structured platform data.
    Returns a dict with platform fields, or {"error": "..."} on failure.
    """
    # Truncate HTML to avoid token limits (Haiku has 200K context, but keep it reasonable)
    truncated = html[:80000] if len(html) > 80000 else html

    prompt = PARSE_PROMPT.format(html=truncated)

    try:
        logger.info("Calling Claude API for parsing...")
        message = _get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            temperature=0,
            system="You are a data extraction assistant. Always respond with valid JSON only.",
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()

        # Extract JSON from response (handle possible markdown wrapping)
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            raw = json_match.group(0)

        data = json.loads(raw)
        return data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude response as JSON: {e}")
        logger.debug(f"Raw response: {raw[:500]}")
        return {"error": f"JSON parse error: {e}"}
    except Exception as e:
        logger.error(f"Claude API call failed: {e}")
        return {"error": str(e)}
