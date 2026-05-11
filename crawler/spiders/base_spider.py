import random
import time
import logging
from abc import ABC, abstractmethod
import httpx

logger = logging.getLogger(__name__)


class BaseSpider(ABC):
    """Base class for all spiders."""

    name: str = "base"

    def __init__(self):
        self.client = httpx.Client(
            timeout=30,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            follow_redirects=True,
        )

    def random_delay(self, min_s: float = 1.0, max_s: float = 3.0):
        """Sleep for a random duration to avoid being blocked."""
        delay = random.uniform(min_s, max_s)
        logger.debug(f"[{self.name}] Sleeping {delay:.1f}s")
        time.sleep(delay)

    def fetch(self, url: str) -> str | None:
        """Fetch a URL and return response text, or None on failure."""
        try:
            logger.info(f"[{self.name}] Fetching {url}")
            resp = self.client.get(url)
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            logger.error(f"[{self.name}] HTTP error {e.response.status_code} for {url}")
            return None
        except httpx.RequestError as e:
            logger.error(f"[{self.name}] Request error for {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"[{self.name}] Unexpected error fetching {url}: {e}")
            return None

    @abstractmethod
    def run(self):
        """Execute the spider. Must be implemented by subclasses."""
        ...

    def close(self):
        """Clean up resources."""
        self.client.close()
