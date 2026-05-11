import json
import logging
import re
import httpx
from config import DEEPSEEK_API_KEY

logger = logging.getLogger(__name__)

DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

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
    Send HTML content to DeepSeek and get structured platform data.
    Returns a dict with platform fields, or {"error": "..."} on failure.
    """
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY is not set in .env")

    # Truncate HTML to avoid token limits
    truncated = html[:80000] if len(html) > 80000 else html
    prompt = PARSE_PROMPT.replace("{html}", truncated)

    try:
        logger.info("Calling DeepSeek API for parsing...")
        resp = httpx.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "You are a data extraction assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1024,
                "temperature": 0,
            },
            timeout=60,
        )
        resp.raise_for_status()

        body = resp.json()
        raw = body["choices"][0]["message"]["content"].strip()

        # Extract JSON from response (handle possible markdown wrapping)
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            raw = json_match.group(0)

        data = json.loads(raw)
        return data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse DeepSeek response as JSON: {e}")
        logger.debug(f"Raw response: {raw[:500]}")
        return {"error": f"JSON parse error: {e}"}
    except httpx.HTTPStatusError as e:
        logger.error(f"DeepSeek API HTTP {e.response.status_code}: {e.response.text[:500]}")
        return {"error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"DeepSeek API call failed: {e}")
        return {"error": str(e)}
