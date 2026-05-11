"""
GPT Navigator Crawler — CLI entry point.

Usage:
    python main.py discover       # Find new platforms from directory sites
    python main.py crawl          # Process pending detail jobs
    python main.py update         # Re-crawl active platforms for freshness
    python main.py crawl --loop   # Keep consuming jobs until queue is empty
"""

import sys
import logging
import argparse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("crawler")


def cmd_discover():
    """Run the discovery spider to find new platforms."""
    from spiders.discovery_spider import DiscoverySpider

    spider = DiscoverySpider()
    try:
        count = spider.run()
        logger.info(f"Discovery complete. {count} new crawl_jobs created.")
    finally:
        spider.close()


def cmd_crawl(loop: bool = False, limit: int = 5):
    """Run the detail spider to process pending crawl_jobs."""
    from spiders.detail_spider import DetailSpider

    spider = DetailSpider()
    try:
        if loop:
            total = 0
            while True:
                count = spider.run(limit=limit)
                total += count
                if count == 0:
                    logger.info(f"Queue empty. Total processed: {total}")
                    break
                logger.info(f"Batch done ({count} jobs). Continuing...")
        else:
            spider.run(limit=limit)
    finally:
        spider.close()


def cmd_update():
    """Re-crawl active platforms to refresh data and check availability."""
    from db import get_all_active_platforms, insert_crawl_log
    import httpx

    platforms = get_all_active_platforms()
    if not platforms:
        logger.info("No active platforms to update")
        return

    logger.info(f"Updating {len(platforms)} active platforms...")
    client = httpx.Client(timeout=20, follow_redirects=True)

    for p in platforms:
        try:
            resp = client.get(p["website_url"])
            status = "active" if resp.status_code < 400 else "inactive"
            changes = {}
            if status == "inactive":
                changes["status"] = "inactive"
                logger.warning(f"[update] {p['name']} is unreachable (HTTP {resp.status_code})")

            insert_crawl_log(p["id"], changes=changes if changes else None)
        except Exception as e:
            logger.error(f"[update] Failed to check {p['name']}: {e}")
            insert_crawl_log(p["id"], changes={"status": "unreachable", "error": str(e)[:200]})

    client.close()
    logger.info(f"Update complete. Checked {len(platforms)} platforms.")


def main():
    parser = argparse.ArgumentParser(description="GPT Navigator Crawler")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("discover", help="Discover new platforms")
    crawl_p = sub.add_parser("crawl", help="Process detail jobs")
    crawl_p.add_argument("--loop", action="store_true", help="Keep consuming until queue empty")
    crawl_p.add_argument("--limit", type=int, default=5, help="Jobs per batch")
    sub.add_parser("update", help="Update existing platforms")

    args = parser.parse_args()

    if args.command == "discover":
        cmd_discover()
    elif args.command == "crawl":
        cmd_crawl(loop=args.loop, limit=args.limit)
    elif args.command == "update":
        cmd_update()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
