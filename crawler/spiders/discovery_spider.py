import logging
import re
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from spiders.base_spider import BaseSpider
from db import insert_crawl_job, target_url_exists

logger = logging.getLogger(__name__)

# Known non-platform domains to skip
SKIP_DOMAINS = {
    "google.com", "facebook.com", "twitter.com", "youtube.com", "instagram.com",
    "reddit.com", "wikipedia.org", "apple.com", "play.google.com", "amazon.com",
    "trustpilot.com", "sitejabber.com", "bbb.org",
}

# Source-specific configurations
SOURCES = [
    {
        "name": "gpthub.gg",
        "url": "https://gpthub.gg",
        "selectors": ["a[href]", "h2 a", "h3 a"],
        "url_filter": lambda u: "gpthub.gg" not in u,
    },
    {
        "name": "elitesurveysites.com",
        "url": "https://elitesurveysites.com",
        "selectors": ["a[href]", ".entry-content a", "article a"],
        "url_filter": lambda u: "elitesurveysites.com" not in u,
    },
    {
        "name": "reddit_beermoney",
        "url": "https://old.reddit.com/r/beermoney/top/?sort=top&t=year",
        "selectors": ["a.title", "a[data-url]"],
        "url_filter": lambda u: True,
    },
    {
        "name": "trustpilot_rewards",
        "url": "https://www.trustpilot.com/categories/rewards_programs",
        "selectors": ["a[href*='review']", "a[name]"],
        "url_filter": lambda u: "trustpilot.com" not in u and "review" in u,
    },
]


def extract_domain(url: str) -> str:
    """Extract domain from a URL, e.g. freecash.com."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def looks_like_platform_url(url: str) -> bool:
    """Heuristic: does this URL look like it points to a GPT platform?"""
    domain = extract_domain(url)
    if not domain:
        return False
    if domain in SKIP_DOMAINS or any(d in domain for d in SKIP_DOMAINS):
        return False
    # Skip common non-platform paths
    skip_paths = ["/login", "/signup", "/about", "/privacy", "/terms", "/cdn-cgi"]
    for sp in skip_paths:
        if sp in url.lower():
            return False
    return True


class DiscoverySpider(BaseSpider):
    """Discover new GPT platforms from directory sites and communities."""

    name = "discovery"

    def run(self):
        total_new = 0
        for source in SOURCES:
            logger.info(f"[discovery] Crawling {source['name']}: {source['url']}")
            html = self.fetch(source["url"])
            if not html:
                logger.warning(f"[discovery] Failed to fetch {source['name']}, skipping")
                continue

            self.random_delay()
            found_urls = self._extract_platform_links(html, source)
            logger.info(f"[discovery] Found {len(found_urls)} potential links from {source['name']}")

            inserted = 0
            for url, name_hint in found_urls:
                if target_url_exists(url):
                    continue
                ok = insert_crawl_job(url, source["name"], "detail")
                if ok:
                    inserted += 1
                    logger.info(f"[discovery] New: {name_hint} ({url})")

            logger.info(f"[discovery] {source['name']}: {inserted} new jobs inserted")
            total_new += inserted

        logger.info(f"[discovery] Done. Total new jobs: {total_new}")
        return total_new

    def _extract_platform_links(self, html: str, source: dict) -> list[tuple[str, str]]:
        """Extract (url, name_hint) tuples from HTML."""
        soup = BeautifulSoup(html, "lxml")
        found = {}
        url_filter = source.get("url_filter", lambda u: True)
        selectors = source.get("selectors", ["a[href]"])

        seen_texts = set()

        for selector in selectors:
            for link in soup.select(selector):
                href = link.get("href", "")
                if not href:
                    # Check custom attrs
                    href = link.get("data-url", "")
                    if not href:
                        continue

                # Make absolute
                full_url = urljoin(source["url"], href)
                domain = extract_domain(full_url)

                if not domain:
                    continue
                if not looks_like_platform_url(full_url):
                    continue
                if not url_filter(full_url):
                    continue

                # Get a readable name from link text
                text = (link.get_text(strip=True) or domain).lower()
                # Deduplicate by similar text
                if text in seen_texts:
                    continue
                seen_texts.add(text)

                # Prefer the root URL
                root_url = f"https://{domain}"
                if root_url not in found:
                    # Use meaningful text as name hint
                    name_hint = link.get_text(strip=True) if len(link.get_text(strip=True) or "") < 50 else domain
                    found[root_url] = name_hint

        return [(url, name) for url, name in found.items()]

    def close(self):
        super().close()
