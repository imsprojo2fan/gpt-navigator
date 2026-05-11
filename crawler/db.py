import psycopg2
import psycopg2.extras
from config import DATABASE_URL


def get_conn():
    """Get a new database connection."""
    return psycopg2.connect(DATABASE_URL)


def fetch_pending_jobs(limit: int = 5) -> list[dict]:
    """Fetch pending crawl_jobs, oldest first."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, target_url, source_site, job_type
                FROM crawl_jobs
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT %s
                FOR UPDATE SKIP LOCKED
                """,
                (limit,),
            )
            return cur.fetchall()
    finally:
        conn.close()


def mark_job_running(job_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE crawl_jobs SET status = 'running' WHERE id = %s",
                (job_id,),
            )
        conn.commit()
    finally:
        conn.close()


def mark_job_done(job_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE crawl_jobs SET status = 'done', processed_at = NOW() WHERE id = %s",
                (job_id,),
            )
        conn.commit()
    finally:
        conn.close()


def mark_job_failed(job_id: int, error_msg: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE crawl_jobs
                SET status = 'failed', error_msg = %s, retry_count = retry_count + 1, processed_at = NOW()
                WHERE id = %s
                """,
                (error_msg, job_id),
            )
        conn.commit()
    finally:
        conn.close()


def insert_crawl_job(target_url: str, source_site: str, job_type: str) -> bool:
    """Insert a new crawl_job, skipping duplicates."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO crawl_jobs (target_url, source_site, job_type)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (target_url, source_site, job_type),
            )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def target_url_exists(target_url: str) -> bool:
    """Check if a target_url already exists in crawl_jobs (any status)."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM crawl_jobs WHERE target_url = %s LIMIT 1",
                (target_url,),
            )
            return cur.fetchone() is not None
    finally:
        conn.close()


def upsert_platform(slug: str, name: str, description: str | None,
                    website_url: str, logo_url: str | None = None,
                    min_cashout: str | None = None,
                    trustpilot_score: float | None = None,
                    trustpilot_url: str | None = None) -> int:
    """Insert or update a platform, return its id."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO platforms (slug, name, description, website_url, logo_url, min_cashout, trustpilot_score, trustpilot_url, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    logo_url = EXCLUDED.logo_url,
                    min_cashout = EXCLUDED.min_cashout,
                    trustpilot_score = EXCLUDED.trustpilot_score,
                    trustpilot_url = EXCLUDED.trustpilot_url,
                    updated_at = NOW()
                RETURNING id
                """,
                (slug, name, description, website_url, logo_url, min_cashout,
                 trustpilot_score, trustpilot_url),
            )
            row = cur.fetchone()
            conn.commit()
            return row[0]
    finally:
        conn.close()


def upsert_platform_features(platform_id: int, task_types: list[str],
                             payment_methods: list[str], regions: list[str],
                             has_mobile_app: bool, is_beginner_friendly: bool):
    """Insert or update platform_features for a given platform."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO platform_features (platform_id, task_types, payment_methods, regions, has_mobile_app, is_beginner_friendly)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (platform_id) DO UPDATE SET
                    task_types = EXCLUDED.task_types,
                    payment_methods = EXCLUDED.payment_methods,
                    regions = EXCLUDED.regions,
                    has_mobile_app = EXCLUDED.has_mobile_app,
                    is_beginner_friendly = EXCLUDED.is_beginner_friendly
                """,
                (platform_id, task_types, payment_methods, regions,
                 has_mobile_app, is_beginner_friendly),
            )
        conn.commit()
    finally:
        conn.close()


def insert_crawl_log(platform_id: int, changes: dict | None = None,
                     snapshot: dict | None = None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO crawl_logs (platform_id, changes, snapshot)
                VALUES (%s, %s, %s)
                """,
                (platform_id, psycopg2.extras.Json(changes) if changes else None,
                 psycopg2.extras.Json(snapshot) if snapshot else None),
            )
        conn.commit()
    finally:
        conn.close()


def get_all_active_platforms() -> list[dict]:
    """Get all active platforms for periodic update."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, name, slug, website_url FROM platforms WHERE status = 'active'"
            )
            return cur.fetchall()
    finally:
        conn.close()
