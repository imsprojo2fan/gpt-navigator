import logging
import re
import json
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from spiders.base_spider import BaseSpider
from parsers.ai_parser import parse_html
from db import (
    fetch_pending_jobs, mark_job_running, mark_job_done, mark_job_failed,
    upsert_platform, upsert_platform_features, insert_crawl_log,
)

logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    """Convert platform name to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def validate_parsed(data: dict) -> dict | None:
    """
    Validate and normalize AI-parsed data.
    Returns cleaned dict or None if data is too incomplete.
    """
    if not data:
        return None
    if "error" in data:
        logger.warning(f"AI parser returned error: {data['error']}")
        return None

    name = (data.get("name") or "").strip()
    if not name or len(name) < 2 or len(name) > 100:
        return None

    allowed_payment = {"paypal", "crypto", "giftcard", "bank", "venmo", "skrill", "payoneer"}
    allowed_tasks = {"survey", "games", "app", "video", "referral", "shopping", "cashback", "offer"}
    allowed_regions = {"US", "UK", "CA", "AU", "Global", "EU", "NZ", "IE", "DE", "FR"}

    payment_methods = [p for p in (data.get("payment_methods") or [])
                       if p.lower() in allowed_payment]
    task_types = [t for t in (data.get("task_types") or [])
                  if t.lower() in allowed_tasks]
    regions = [r for r in (data.get("regions") or [])
               if r.upper() in allowed_regions]

    description = (data.get("description") or "").strip()[:500]
    min_cashout = (data.get("min_cashout") or "").strip()[:50]

    return {
        "name": name,
        "description": description or None,
        "min_cashout": min_cashout or None,
        "payment_methods": payment_methods,
        "task_types": task_types,
        "regions": regions,
        "has_mobile_app": bool(data.get("has_mobile_app", False)),
        "is_beginner_friendly": True,
    }


class DetailSpider(BaseSpider):
    """Fetch platform websites with Playwright and extract structured data via Claude API."""

    name = "detail"

    def __init__(self):
        super().__init__()
        self.playwright = None
        self.browser = None

    def _launch_browser(self):
        if self.browser:
            return
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)

    def run(self, limit: int = 5):
        jobs = fetch_pending_jobs(limit)
        if not jobs:
            logger.info("[detail] No pending jobs")
            return 0

        logger.info(f"[detail] Processing {len(jobs)} jobs")
        success = 0

        self._launch_browser()

        for job in jobs:
            try:
                mark_job_running(job["id"])
                self.random_delay()
                result = self._process_one(job)

                if result:
                    success += 1
                    mark_job_done(job["id"])
                else:
                    mark_job_failed(job["id"], "AI parsing returned no data")
            except Exception as e:
                logger.error(f"[detail] Job {job['id']} failed: {e}")
                mark_job_failed(job["id"], str(e)[:500])

        logger.info(f"[detail] Done. Processed {len(jobs)} jobs, {success} succeeded")
        return success

    def _process_one(self, job: dict) -> bool:
        """
        Fetch the platform website and Trustpilot page,
        parse with AI, and write to database.
        """
        target_url = job["target_url"]
        logger.info(f"[detail] Processing {target_url}")

        # Fetch main website with Playwright
        page_html = self._fetch_with_browser(target_url)
        if not page_html:
            logger.warning(f"[detail] No HTML from {target_url}, trying httpx fallback")
            raw = self.fetch(target_url)
            page_html = raw or ""

        # Combine with Trustpilot content if we can find it
        trustpilot_html = self._fetch_trustpilot(target_url)
        combined_html = page_html
        if trustpilot_html:
            combined_html += "\n<!-- TRUSTPILOT -->\n" + trustpilot_html[:40000]

        # Parse with Claude API
        parsed = parse_html(combined_html)
        validated = validate_parsed(parsed)
        if not validated:
            return False

        # Generate slug from name
        slug = slugify(validated["name"])
        if not slug:
            return False

        # Extract Trustpilot score from parsed data or direct scrape
        trustpilot_score = None

        # Upsert platform
        platform_id = upsert_platform(
            slug=slug,
            name=validated["name"],
            description=validated["description"],
            website_url=target_url,
            min_cashout=validated["min_cashout"],
            trustpilot_score=trustpilot_score,
            trustpilot_url=None,
        )

        # Upsert platform features
        upsert_platform_features(
            platform_id=platform_id,
            task_types=validated["task_types"],
            payment_methods=validated["payment_methods"],
            regions=validated["regions"],
            has_mobile_app=validated["has_mobile_app"],
            is_beginner_friendly=validated["is_beginner_friendly"],
        )

        # Record crawl log
        snapshot = {
            "name": validated["name"],
            "description": validated["description"],
            "task_types": validated["task_types"],
            "payment_methods": validated["payment_methods"],
        }
        insert_crawl_log(platform_id, snapshot=snapshot)

        logger.info(f"[detail] Saved: {validated['name']} (id={platform_id})")
        return True

    def _fetch_with_browser(self, url: str) -> str | None:
        """Fetch page HTML using Playwright for JavaScript-rendered pages."""
        page = self.browser.new_page()
        try:
            logger.info(f"[detail] Playwright loading {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            # Wait a bit for async rendering
            page.wait_for_timeout(3000)
            html = page.content()
            return html
        except PlaywrightTimeout:
            logger.warning(f"[detail] Playwright timeout for {url}")
            return None
        except Exception as e:
            logger.error(f"[detail] Playwright error for {url}: {e}")
            return None
        finally:
            page.close()

    def _fetch_trustpilot(self, website_url: str) -> str | None:
        """Try to find Trustpilot page for the given website."""
        domain = ""
        try:
            from urllib.parse import urlparse
            domain = urlparse(website_url).netloc.replace("www.", "")
        except Exception:
            return None

        if not domain:
            return None

        # Search Trustpilot for this domain
        search_url = f"https://www.trustpilot.com/search?query={domain}"
        try:
            import httpx
            resp = httpx.get(search_url, headers=self.client.headers, timeout=15)
            if resp.status_code == 200:
                return resp.text[:50000]
        except Exception:
            pass

        return None

    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        super().close()
