"""Dual Database Engine: PostgreSQL (Supabase Cloud) with SQLite Fallback (Local Dev)."""

import os
import sqlite3
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None
    RealDictCursor = None


class JobDatabase:
    """Manages persistent job records, post dates, application pipeline statuses, trash/restore, and AI feedback.
    
    Seamlessly supports both:
    1. Cloud Production: PostgreSQL (Supabase) via DATABASE_URL
    2. Local Development: SQLite (data/jobs_tracker.db)
    """

    def __init__(self, db_path: str = "data/jobs_tracker.db"):
        self.database_url = os.environ.get("DATABASE_URL", "").strip()
        self.is_postgres = bool(
            self.database_url 
            and (self.database_url.startswith("postgres://") or self.database_url.startswith("postgresql://"))
            and psycopg2 is not None
        )
        
        # Normalize postgres:// to postgresql:// for SQLAlchemy / Psycopg2 compatibility
        if self.is_postgres and self.database_url.startswith("postgres://"):
            self.database_url = "postgresql://" + self.database_url[len("postgres://"):]

        self.db_path = Path(db_path)
        if not self.is_postgres:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self._init_db()

    def _get_connection(self):
        if self.is_postgres:
            conn = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
            return conn
        else:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn

    def _execute(self, conn, query: str, params: Optional[tuple] = None):
        """Executes a query adjusting parameter placeholders (? for SQLite, %s for PostgreSQL)."""
        params = params or ()
        if self.is_postgres:
            pg_query = query.replace("?", "%s")
            cur = conn.cursor()
            cur.execute(pg_query, params)
            return cur
        else:
            return conn.execute(query, params)

    def _init_db(self):
        auto_inc = "SERIAL PRIMARY KEY" if self.is_postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"
        
        with self._get_connection() as conn:
            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT,
                company TEXT,
                location TEXT,
                country TEXT,
                source TEXT,
                posted_ago TEXT,
                posted_date TEXT,
                posted_days_ago INTEGER DEFAULT 0,
                apply_url TEXT,
                description TEXT,
                match_score INTEGER,
                fit_verdict TEXT,
                summary TEXT,
                missing_keywords TEXT,
                tailored_bullets TEXT,
                tailored_headline TEXT,
                hiring_managers TEXT,
                status TEXT DEFAULT 'new',
                feedback_rating TEXT DEFAULT 'neutral',
                feedback_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            try:
                self._execute(conn, "ALTER TABLE jobs ADD COLUMN posted_date TEXT")
            except Exception:
                pass
            try:
                self._execute(conn, "ALTER TABLE jobs ADD COLUMN posted_days_ago INTEGER DEFAULT 0")
            except Exception:
                pass

            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS ai_feedback_rules (
                id {auto_inc},
                job_id TEXT,
                rule_type TEXT,
                term TEXT,
                weight REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.commit()

    def _parse_post_date(self, posted_ago: str) -> (str, int):
        """Calculates exact ISO date and integer days ago from relative strings like '3 days ago'."""
        now = datetime.now()
        ago_str = (posted_ago or "").lower()

        days_ago = 0
        if "day" in ago_str:
            match = re.search(r'(\d+)\s*day', ago_str)
            days_ago = int(match.group(1)) if match else 1
        elif "week" in ago_str:
            match = re.search(r'(\d+)\s*week', ago_str)
            days_ago = int(match.group(1)) * 7 if match else 7
        elif "hour" in ago_str or "minute" in ago_str or "today" in ago_str or "just" in ago_str:
            days_ago = 0
        elif "month" in ago_str:
            days_ago = 30

        calc_date = (now - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        return calc_date, days_ago

    def save_job(self, job: Dict[str, Any], country_tag: str = "Gulf") -> bool:
        """Inserts or updates a job posting. Respects 'trash' status and prevents re-activating trashed jobs."""
        job_id = job.get("id") or f"job_{abs(hash(job.get('title', '') + job.get('company', '')))}"
        analysis = job.get("cv_analysis", {})
        posted_ago = job.get("posted_ago", "Recent")
        posted_date, days_ago = self._parse_post_date(posted_ago)
        
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT id, status FROM jobs WHERE id = ?", (job_id,))
            existing = cur.fetchone()
            
            if existing:
                # If job was previously moved to trash, keep it in trash and don't overwrite
                if existing["status"] == "trash":
                    return False
                
                # Update posted date if newer
                self._execute(conn, """
                UPDATE jobs SET posted_ago = ?, posted_date = ?, posted_days_ago = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                """, (posted_ago, posted_date, days_ago, job_id))
                conn.commit()
                return False

            self._execute(conn, """
            INSERT INTO jobs (
                id, title, company, location, country, source, posted_ago,
                posted_date, posted_days_ago, apply_url, description,
                match_score, fit_verdict, summary, missing_keywords,
                tailored_bullets, tailored_headline, hiring_managers,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (
                job_id,
                job.get("title", ""),
                job.get("company", ""),
                job.get("location", ""),
                job.get("country", country_tag),
                job.get("source", "Web"),
                posted_ago,
                posted_date,
                days_ago,
                job.get("apply_url", "#"),
                job.get("description", ""),
                analysis.get("match_score", 70),
                analysis.get("fit_verdict", "Good Match"),
                analysis.get("summary", ""),
                json.dumps(analysis.get("missing_keywords", [])),
                json.dumps(analysis.get("tailored_cv_bullets", [])),
                analysis.get("tailored_summary_headline", ""),
                json.dumps(job.get("hiring_managers", []))
            ))
            conn.commit()
            return True

    def get_jobs(
        self,
        region: Optional[str] = None,
        status: Optional[str] = None,
        time_filter: Optional[str] = None,
        search: Optional[str] = None,
        rating: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Queries jobs with region, status, search, and time-window filtering. Automatically excludes Trash unless status='trash'."""
        query = "SELECT * FROM jobs WHERE 1=1"
        params = []

        # Trash handling: if status is 'trash', show only trashed. Otherwise, hide trash completely!
        if status and status.lower() == "trash":
            query += " AND status = 'trash'"
        elif status and status.lower() != "all":
            query += " AND status = ?"
            params.append(status.lower())
        else:
            query += " AND status != 'trash'"

        if region and region.lower() != "all":
            if "pakistan" in region.lower():
                query += " AND country = 'Pakistan'"
            elif "gulf" in region.lower():
                query += " AND country != 'Pakistan'"

        if rating and rating.lower() != "all":
            query += " AND feedback_rating = ?"
            params.append(rating.lower())

        # Time Window Filtering
        if time_filter and time_filter.lower() != "all":
            tf = time_filter.lower()
            if tf in ["24h", "1d", "today"]:
                query += " AND posted_days_ago <= 0"
            elif tf in ["2d", "48h"]:
                query += " AND posted_days_ago <= 1"
            elif tf in ["3d", "72h"]:
                query += " AND posted_days_ago <= 3"
            elif tf in ["week", "7d"]:
                query += " AND posted_days_ago <= 7"

        if search:
            query += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        query += " ORDER BY posted_days_ago ASC, match_score DESC, created_at DESC"

        with self._get_connection() as conn:
            cur = self._execute(conn, query, tuple(params))
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["missing_keywords"] = json.loads(d.get("missing_keywords") or "[]")
                d["tailored_bullets"] = json.loads(d.get("tailored_bullets") or "[]")
                d["hiring_managers"] = json.loads(d.get("hiring_managers") or "[]")
                results.append(d)
            return results

    def update_job_status(self, job_id: str, new_status: str) -> bool:
        with self._get_connection() as conn:
            self._execute(conn, """
            UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (new_status.lower(), job_id))
            conn.commit()
            return True

    def delete_job_permanently(self, job_id: str) -> bool:
        with self._get_connection() as conn:
            self._execute(conn, "DELETE FROM jobs WHERE id = ?", (job_id,))
            conn.commit()
            return True

    def set_feedback(self, job_id: str, rating: str, notes: str = "") -> Dict[str, Any]:
        with self._get_connection() as conn:
            self._execute(conn, """
            UPDATE jobs SET feedback_rating = ?, feedback_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (rating.lower(), notes, job_id))

            cur = self._execute(conn, "SELECT title, company FROM jobs WHERE id = ?", (job_id,))
            row = cur.fetchone()
            if row:
                company = row["company"]
                if rating == "like":
                    self._execute(conn, "INSERT INTO ai_feedback_rules (job_id, rule_type, term, weight) VALUES (?, 'boost_company', ?, 1.2)", (job_id, company))
                elif rating == "dislike":
                    self._execute(conn, "INSERT INTO ai_feedback_rules (job_id, rule_type, term, weight) VALUES (?, 'penalize_company', ?, 0.5)", (job_id, company))

            conn.commit()
            return {"status": "success", "rating": rating}

    def get_learned_rules(self) -> Dict[str, List[str]]:
        with self._get_connection() as conn:
            cur1 = self._execute(conn, "SELECT DISTINCT term FROM ai_feedback_rules WHERE rule_type LIKE 'boost%'")
            boosted = [r["term"] for r in cur1.fetchall()]
            cur2 = self._execute(conn, "SELECT DISTINCT term FROM ai_feedback_rules WHERE rule_type LIKE 'penalize%'")
            penalized = [r["term"] for r in cur2.fetchall()]
            return {"boosted": boosted, "penalized": penalized}

    def get_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            def _fetch_scalar(q: str):
                cur = self._execute(conn, q)
                res = cur.fetchone()
                if isinstance(res, (list, tuple)):
                    return res[0]
                elif hasattr(res, "values"):
                    return list(res.values())[0]
                elif res is not None:
                    return res[0]
                return 0

            return {
                "total_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status != 'trash'"),
                "new_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'new'"),
                "applied_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'applied'"),
                "interviewing_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'interviewing'"),
                "saved_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'saved'"),
                "trashed_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'trash'"),
                "pakistan_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE country = 'Pakistan' AND status != 'trash'"),
                "gulf_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE country != 'Pakistan' AND status != 'trash'"),
                "last_24h_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE posted_days_ago <= 0 AND status != 'trash'"),
                "last_3d_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE posted_days_ago <= 3 AND status != 'trash'"),
            }
