"""Dual Database Engine: PostgreSQL (Supabase Cloud) with SQLite Fallback (Local Dev)."""

import os
import shutil
import sqlite3
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

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
            is_readonly_env = bool(os.environ.get("VERCEL"))
            if not is_readonly_env:
                try:
                    self.db_path.parent.mkdir(parents=True, exist_ok=True)
                    if not os.access(str(self.db_path.parent), os.W_OK):
                        is_readonly_env = True
                    elif self.db_path.exists() and not os.access(str(self.db_path), os.W_OK):
                        is_readonly_env = True
                except OSError:
                    is_readonly_env = True

            if is_readonly_env:
                tmp_db_path = Path("/tmp") / self.db_path.name
                if not tmp_db_path.exists() and self.db_path.exists():
                    try:
                        shutil.copy2(self.db_path, tmp_db_path)
                    except OSError:
                        pass
                self.db_path = tmp_db_path

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

            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS users (
                id {auto_inc},
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                token_version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            try:
                self._execute(conn, "ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1")
            except Exception:
                pass
            try:
                self._execute(conn, "ALTER TABLE users ADD COLUMN searches_count INTEGER DEFAULT 0")
            except Exception:
                pass
            try:
                self._execute(conn, "ALTER TABLE users ADD COLUMN max_free_searches INTEGER DEFAULT 10")
            except Exception:
                pass

            # Multi-Tenant User Job Interactions Table (Per-user status, bookmark, feedback, and notes)
            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS user_job_interactions (
                id {auto_inc},
                user_id INTEGER NOT NULL,
                job_id TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                feedback_rating TEXT DEFAULT 'neutral',
                feedback_notes TEXT,
                applied_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, job_id)
            )
            """)

            try:
                self._execute(conn, "CREATE INDEX IF NOT EXISTS idx_uji_lookup ON user_job_interactions(user_id, job_id)")
                self._execute(conn, "CREATE INDEX IF NOT EXISTS idx_uji_status ON user_job_interactions(user_id, status)")
            except Exception:
                pass

            # Multi-Tenant User Preferences Table (Per-user CV, primary stack, and search preferences)
            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id {auto_inc},
                user_id INTEGER UNIQUE NOT NULL,
                candidate_name TEXT,
                active_cv TEXT,
                primary_stack TEXT,
                default_roles TEXT,
                excluded_keywords TEXT,
                custom_instructions TEXT,
                min_match_score INTEGER DEFAULT 55,
                experience_level TEXT DEFAULT 'Mid-Senior',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            try:
                self._execute(conn, "CREATE INDEX IF NOT EXISTS idx_up_user ON user_preferences(user_id)")
            except Exception:
                pass

            # Extended Career Profile Fields (FRD 5.2)
            profile_cols = [
                ("email", "TEXT"),
                ("phone", "TEXT"),
                ("current_location", "TEXT"),
                ("target_locations", "TEXT"),
                ("expected_salary", "TEXT"),
                ("work_history", "TEXT"),
                ("education", "TEXT"),
                ("bio", "TEXT")
            ]
            for col_name, col_type in profile_cols:
                try:
                    self._execute(conn, f"ALTER TABLE user_preferences ADD COLUMN {col_name} {col_type}")
                except Exception:
                    pass

            # Multi-Tenant Notification Settings Table
            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS user_notification_settings (
                id {auto_inc},
                user_id INTEGER UNIQUE NOT NULL,
                alerts_enabled BOOLEAN DEFAULT 1,
                alert_email TEXT,
                min_match_score INTEGER DEFAULT 70,
                preferred_regions TEXT DEFAULT '["all"]',
                frequency TEXT DEFAULT 'instant',
                last_alert_sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Multi-Tenant Sent Alerts Log (Prevents duplicate email notifications for the same job)
            self._execute(conn, f"""
            CREATE TABLE IF NOT EXISTS user_sent_alerts (
                id {auto_inc},
                user_id INTEGER NOT NULL,
                job_id TEXT NOT NULL,
                match_score INTEGER DEFAULT 0,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, job_id)
            )
            """)

            try:
                self._execute(conn, "CREATE INDEX IF NOT EXISTS idx_usa_user ON user_sent_alerts(user_id)")
                self._execute(conn, "CREATE INDEX IF NOT EXISTS idx_usa_lookup ON user_sent_alerts(user_id, job_id)")
            except Exception:
                pass

            # Migrate legacy job interaction states for admin/user 1 if newly initialized
            try:
                if self.is_postgres:
                    self._execute(conn, """
                    INSERT INTO user_job_interactions (user_id, job_id, status, feedback_rating, feedback_notes)
                    SELECT 1, id, status, feedback_rating, feedback_notes FROM jobs 
                    WHERE status != 'new' OR feedback_rating != 'neutral'
                    ON CONFLICT (user_id, job_id) DO NOTHING
                    """)
                else:
                    self._execute(conn, """
                    INSERT OR IGNORE INTO user_job_interactions (user_id, job_id, status, feedback_rating, feedback_notes)
                    SELECT 1, id, status, feedback_rating, feedback_notes FROM jobs 
                    WHERE status != 'new' OR feedback_rating != 'neutral'
                    """)
            except Exception:
                pass

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
        user_id: Optional[int] = None,
        region: Optional[str] = None,
        status: Optional[str] = None,
        time_filter: Optional[str] = None,
        search: Optional[str] = None,
        rating: Optional[str] = None,
        min_score: Optional[int] = 0,
        page: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Queries jobs with region, status, search, and time-window filtering.
        When user_id is provided, status and feedback are strictly isolated to that user's interactions."""
        params = []
        if user_id:
            query = """
            SELECT 
                jobs.id, jobs.title, jobs.company, jobs.location, jobs.country, jobs.source,
                jobs.posted_ago, jobs.posted_date, jobs.posted_days_ago, jobs.apply_url,
                jobs.description, jobs.match_score, jobs.fit_verdict, jobs.summary,
                jobs.missing_keywords, jobs.tailored_bullets, jobs.tailored_headline,
                jobs.hiring_managers, jobs.created_at, jobs.updated_at,
                COALESCE(uji.status, 'new') AS status,
                COALESCE(uji.feedback_rating, 'neutral') AS feedback_rating,
                uji.feedback_notes AS feedback_notes,
                uji.applied_at AS user_applied_at
            FROM jobs
            LEFT JOIN user_job_interactions uji ON jobs.id = uji.job_id AND uji.user_id = ?
            WHERE 1=1
            """
            params.append(user_id)
            status_col = "COALESCE(uji.status, 'new')"
            rating_col = "COALESCE(uji.feedback_rating, 'neutral')"
            country_col = "jobs.country"
            time_col = "jobs.posted_days_ago"
            order_clause = " ORDER BY jobs.posted_days_ago ASC, jobs.match_score DESC, jobs.created_at DESC"
        else:
            query = "SELECT * FROM jobs WHERE 1=1"
            status_col = "status"
            rating_col = "feedback_rating"
            country_col = "country"
            time_col = "posted_days_ago"
            order_clause = " ORDER BY posted_days_ago ASC, match_score DESC, created_at DESC"

        # Trash handling: if status is 'trash', show only trashed. Otherwise, hide trash completely!
        if status and status.lower() == "trash":
            query += f" AND {status_col} = 'trash'"
        elif status and status.lower() != "all":
            query += f" AND {status_col} = ?"
            params.append(status.lower())
        else:
            query += f" AND {status_col} != 'trash'"

        if region and region.lower() != "all":
            if "pakistan" in region.lower():
                query += f" AND {country_col} = 'Pakistan'"
            elif "gulf" in region.lower():
                query += f" AND {country_col} != 'Pakistan'"

        if rating and rating.lower() != "all":
            query += f" AND {rating_col} = ?"
            params.append(rating.lower())

        # Time Window Filtering
        if time_filter and time_filter.lower() != "all":
            tf = time_filter.lower()
            if tf in ["24h", "1d", "today"]:
                query += f" AND {time_col} <= 0"
            elif tf in ["2d", "48h"]:
                query += f" AND {time_col} <= 1"
            elif tf in ["3d", "72h"]:
                query += f" AND {time_col} <= 3"
            elif tf in ["week", "7d"]:
                query += f" AND {time_col} <= 7"

        if search:
            if user_id:
                query += " AND (jobs.title LIKE ? OR jobs.company LIKE ? OR jobs.description LIKE ?)"
            else:
                query += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        if min_score and int(min_score) > 0:
            query += " AND jobs.match_score >= ?" if user_id else " AND match_score >= ?"
            params.append(int(min_score))

        query += order_clause

        if limit and int(limit) > 0:
            p = max(int(page or 1), 1)
            offset = (p - 1) * int(limit)
            query += " LIMIT ? OFFSET ?"
            params.extend([int(limit), offset])

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

    def get_job(self, job_id: str, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Retrieves a single job record by ID, optionally populated with user interaction status."""
        with self._get_connection() as conn:
            if user_id:
                query = """
                SELECT 
                    jobs.id, jobs.title, jobs.company, jobs.location, jobs.country, jobs.source,
                    jobs.posted_ago, jobs.posted_date, jobs.posted_days_ago, jobs.apply_url,
                    jobs.description, jobs.match_score, jobs.fit_verdict, jobs.summary,
                    jobs.missing_keywords, jobs.tailored_bullets, jobs.tailored_headline,
                    jobs.hiring_managers, jobs.created_at, jobs.updated_at,
                    COALESCE(uji.status, 'new') AS status,
                    COALESCE(uji.feedback_rating, 'neutral') AS feedback_rating,
                    uji.feedback_notes AS feedback_notes,
                    uji.applied_at AS user_applied_at
                FROM jobs
                LEFT JOIN user_job_interactions uji ON jobs.id = uji.job_id AND uji.user_id = ?
                WHERE jobs.id = ?
                """
                cur = self._execute(conn, query, (user_id, job_id))
            else:
                cur = self._execute(conn, "SELECT * FROM jobs WHERE id = ?", (job_id,))
            row = cur.fetchone()
            if not row:
                return None
            d = dict(row)
            d["missing_keywords"] = json.loads(d.get("missing_keywords") or "[]")
            d["tailored_bullets"] = json.loads(d.get("tailored_bullets") or "[]")
            d["hiring_managers"] = json.loads(d.get("hiring_managers") or "[]")
            return d

    def set_user_job_status(self, user_id: int, job_id: str, new_status: str) -> bool:
        """Sets job status strictly for the specific user in user_job_interactions."""
        status_val = new_status.strip().lower()
        applied_at = datetime.now() if status_val == "applied" else None
        with self._get_connection() as conn:
            if self.is_postgres:
                self._execute(conn, """
                INSERT INTO user_job_interactions (user_id, job_id, status, applied_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, job_id) DO UPDATE SET 
                    status = EXCLUDED.status, 
                    applied_at = COALESCE(EXCLUDED.applied_at, user_job_interactions.applied_at),
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, job_id, status_val, applied_at))
            else:
                self._execute(conn, """
                INSERT INTO user_job_interactions (user_id, job_id, status, applied_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, job_id) DO UPDATE SET 
                    status = excluded.status, 
                    applied_at = COALESCE(excluded.applied_at, user_job_interactions.applied_at),
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, job_id, status_val, applied_at))
            conn.commit()
            return True

    def set_user_job_feedback(self, user_id: int, job_id: str, rating: str, notes: str = "") -> Dict[str, Any]:
        """Sets thumbs up/down rating strictly for the specific user."""
        r = rating.strip().lower()
        with self._get_connection() as conn:
            if self.is_postgres:
                self._execute(conn, """
                INSERT INTO user_job_interactions (user_id, job_id, feedback_rating, feedback_notes, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, job_id) DO UPDATE SET 
                    feedback_rating = EXCLUDED.feedback_rating, 
                    feedback_notes = EXCLUDED.feedback_notes,
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, job_id, r, notes))
            else:
                self._execute(conn, """
                INSERT INTO user_job_interactions (user_id, job_id, feedback_rating, feedback_notes, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, job_id) DO UPDATE SET 
                    feedback_rating = excluded.feedback_rating, 
                    feedback_notes = excluded.feedback_notes,
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, job_id, r, notes))

            cur = self._execute(conn, "SELECT title, company FROM jobs WHERE id = ?", (job_id,))
            row = cur.fetchone()
            if row:
                company = row["company"]
                if r == "like":
                    self._execute(conn, "INSERT INTO ai_feedback_rules (job_id, rule_type, term, weight) VALUES (?, 'boost_company', ?, 1.2)", (job_id, company))
                elif r == "dislike":
                    self._execute(conn, "INSERT INTO ai_feedback_rules (job_id, rule_type, term, weight) VALUES (?, 'penalize_company', ?, 0.5)", (job_id, company))

            conn.commit()
            return {"status": "success", "rating": r}

    def update_job_status(self, job_id: str, new_status: str, user_id: Optional[int] = None) -> bool:
        if user_id:
            return self.set_user_job_status(user_id, job_id, new_status)
        with self._get_connection() as conn:
            self._execute(conn, """
            UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (new_status.lower(), job_id))
            conn.commit()
            return True

    def delete_job_permanently(self, job_id: str) -> bool:
        with self._get_connection() as conn:
            self._execute(conn, "DELETE FROM user_job_interactions WHERE job_id = ?", (job_id,))
            self._execute(conn, "DELETE FROM jobs WHERE id = ?", (job_id,))
            conn.commit()
            return True

    def set_feedback(self, job_id: str, rating: str, notes: str = "", user_id: Optional[int] = None) -> Dict[str, Any]:
        if user_id:
            return self.set_user_job_feedback(user_id, job_id, rating, notes)
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

    def get_stats(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Returns application pipeline and discovery counts, isolated to the authenticated user."""
        with self._get_connection() as conn:
            def _fetch_scalar(q: str, p: tuple = ()):
                cur = self._execute(conn, q, p)
                res = cur.fetchone()
                if isinstance(res, (list, tuple)):
                    return res[0]
                elif hasattr(res, "values"):
                    return list(res.values())[0]
                elif res is not None:
                    return res[0]
                return 0

            if user_id:
                base_from = "FROM jobs LEFT JOIN user_job_interactions uji ON jobs.id = uji.job_id AND uji.user_id = ?"
                return {
                    "total_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                    "new_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') = 'new'", (user_id,)),
                    "high_match": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE jobs.match_score >= 70 AND COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                    "applied_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') = 'applied'", (user_id,)),
                    "interviewing_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') = 'interviewing'", (user_id,)),
                    "saved_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') = 'saved'", (user_id,)),
                    "trashed_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE COALESCE(uji.status, 'new') = 'trash'", (user_id,)),
                    "pakistan_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE jobs.country = 'Pakistan' AND COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                    "gulf_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE jobs.country != 'Pakistan' AND COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                    "last_24h_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE jobs.posted_days_ago <= 0 AND COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                    "last_3d_jobs": _fetch_scalar(f"SELECT COUNT(*) {base_from} WHERE jobs.posted_days_ago <= 3 AND COALESCE(uji.status, 'new') != 'trash'", (user_id,)),
                }
            else:
                return {
                    "total_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status != 'trash'"),
                    "new_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'new'"),
                    "high_match": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE match_score >= 70 AND status != 'trash'"),
                    "applied_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'applied'"),
                    "interviewing_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'interviewing'"),
                    "saved_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'saved'"),
                    "trashed_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'trash'"),
                    "pakistan_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE country = 'Pakistan' AND status != 'trash'"),
                    "gulf_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE country != 'Pakistan' AND status != 'trash'"),
                    "last_24h_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE posted_days_ago <= 0 AND status != 'trash'"),
                    "last_3d_jobs": _fetch_scalar("SELECT COUNT(*) FROM jobs WHERE posted_days_ago <= 3 AND status != 'trash'"),
                }

    # ================= User Preferences Management =================

    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Loads customized matching preferences, CV settings and full career profile for the specific user."""
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                d = dict(row)
                target_locs = ["Pakistan", "United Arab Emirates", "Saudi Arabia"]
                try:
                    if d.get("target_locations"):
                        target_locs = json.loads(d.get("target_locations"))
                except Exception:
                    pass

                work_hist = []
                try:
                    if d.get("work_history"):
                        work_hist = json.loads(d.get("work_history"))
                except Exception:
                    pass

                edu_list = []
                try:
                    if d.get("education"):
                        edu_list = json.loads(d.get("education"))
                except Exception:
                    pass

                return {
                    "candidate_name": d.get("candidate_name") or "Candidate",
                    "active_cv": d.get("active_cv") or "",
                    "primary_stack": json.loads(d.get("primary_stack") or "[]"),
                    "default_roles": json.loads(d.get("default_roles") or "[]"),
                    "excluded_keywords": json.loads(d.get("excluded_keywords") or "[]"),
                    "custom_instructions": d.get("custom_instructions") or "",
                    "min_match_score": d.get("min_match_score", 55),
                    "experience_level": d.get("experience_level") or "Mid-Senior",
                    "email": d.get("email") or "",
                    "phone": d.get("phone") or "",
                    "current_location": d.get("current_location") or "Pakistan",
                    "target_locations": target_locs,
                    "expected_salary": d.get("expected_salary") or "",
                    "work_history": work_hist,
                    "education": edu_list,
                    "bio": d.get("bio") or ""
                }

            # Seed default preferences for this user based on user record
            user = self.get_user_by_id(user_id)
            cand_name = (user.get("full_name") or user.get("username") or "Candidate") if user else "Candidate"
            defaults = {
                "candidate_name": cand_name,
                "active_cv": "",
                "primary_stack": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS", "Celery", "Redis"],
                "default_roles": ["Python Developer", "Django Developer", "Backend Engineer", "Full Stack Engineer"],
                "excluded_keywords": ["WordPress", "PHP", "Junior", "Internship"],
                "custom_instructions": "Focus on high-growth engineering roles in Gulf & Remote.",
                "min_match_score": 55,
                "experience_level": "Mid-Senior",
                "email": user.get("email", "") if user else "",
                "phone": "+92 (300) 123-4567",
                "current_location": "Pakistan",
                "target_locations": ["Pakistan", "United Arab Emirates", "Saudi Arabia"],
                "expected_salary": "$50,000 - $80,000 USD / year (or AED 15,000 - 25,000/mo)",
                "work_history": [
                    {
                        "title": "Senior Software Engineer",
                        "company": "Tech Innovations",
                        "period": "2022 - Present",
                        "location": "Pakistan / Remote Gulf",
                        "bullets": [
                            "Architected distributed backend microservices handling high concurrency.",
                            "Optimized database indices and reduced API latency by 40%."
                        ]
                    }
                ],
                "education": [
                    {
                        "degree": "Bachelor of Science in Computer Science (BSCS)",
                        "institution": "National University of Computer & Emerging Sciences (FAST-NUCES)",
                        "year": "2020"
                    }
                ],
                "bio": "Results-driven engineer specializing in high-performance architectures and scalable cloud solutions for international high-growth teams."
            }
            self.save_user_preferences(user_id, defaults)
            return defaults

    def save_user_preferences(self, user_id: int, prefs: Dict[str, Any]) -> bool:
        """Saves user-specific matching preferences, target tech stack, and comprehensive career profile."""
        cand_name = prefs.get("candidate_name", "Candidate")
        active_cv = prefs.get("active_cv", "")
        primary_stack = json.dumps(prefs.get("primary_stack", []))
        default_roles = json.dumps(prefs.get("default_roles", []))
        excluded_keywords = json.dumps(prefs.get("excluded_keywords", []))
        custom_instructions = prefs.get("custom_instructions", "")
        min_match_score = prefs.get("min_match_score", 55)
        experience_level = prefs.get("experience_level", "Mid-Senior")
        email = prefs.get("email", "")
        phone = prefs.get("phone", "")
        current_location = prefs.get("current_location", "Pakistan")
        target_locations = json.dumps(prefs.get("target_locations", ["Pakistan", "United Arab Emirates", "Saudi Arabia"]))
        expected_salary = prefs.get("expected_salary", "")
        work_history = json.dumps(prefs.get("work_history", []))
        education = json.dumps(prefs.get("education", []))
        bio = prefs.get("bio", "")

        with self._get_connection() as conn:
            if self.is_postgres:
                self._execute(conn, """
                INSERT INTO user_preferences (
                    user_id, candidate_name, active_cv, primary_stack, default_roles, 
                    excluded_keywords, custom_instructions, min_match_score, experience_level,
                    email, phone, current_location, target_locations, expected_salary,
                    work_history, education, bio, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    candidate_name = EXCLUDED.candidate_name,
                    active_cv = CASE WHEN EXCLUDED.active_cv != '' THEN EXCLUDED.active_cv ELSE user_preferences.active_cv END,
                    primary_stack = EXCLUDED.primary_stack,
                    default_roles = EXCLUDED.default_roles,
                    excluded_keywords = EXCLUDED.excluded_keywords,
                    custom_instructions = EXCLUDED.custom_instructions,
                    min_match_score = EXCLUDED.min_match_score,
                    experience_level = EXCLUDED.experience_level,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    current_location = EXCLUDED.current_location,
                    target_locations = EXCLUDED.target_locations,
                    expected_salary = EXCLUDED.expected_salary,
                    work_history = EXCLUDED.work_history,
                    education = EXCLUDED.education,
                    bio = EXCLUDED.bio,
                    updated_at = CURRENT_TIMESTAMP
                """, (
                    user_id, cand_name, active_cv, primary_stack, default_roles,
                    excluded_keywords, custom_instructions, min_match_score, experience_level,
                    email, phone, current_location, target_locations, expected_salary,
                    work_history, education, bio
                ))
            else:
                self._execute(conn, """
                INSERT INTO user_preferences (
                    user_id, candidate_name, active_cv, primary_stack, default_roles, 
                    excluded_keywords, custom_instructions, min_match_score, experience_level,
                    email, phone, current_location, target_locations, expected_salary,
                    work_history, education, bio, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    candidate_name = excluded.candidate_name,
                    active_cv = CASE WHEN excluded.active_cv != '' THEN excluded.active_cv ELSE user_preferences.active_cv END,
                    primary_stack = excluded.primary_stack,
                    default_roles = excluded.default_roles,
                    excluded_keywords = excluded.excluded_keywords,
                    custom_instructions = excluded.custom_instructions,
                    min_match_score = excluded.min_match_score,
                    experience_level = excluded.experience_level,
                    email = excluded.email,
                    phone = excluded.phone,
                    current_location = excluded.current_location,
                    target_locations = excluded.target_locations,
                    expected_salary = excluded.expected_salary,
                    work_history = excluded.work_history,
                    education = excluded.education,
                    bio = excluded.bio,
                    updated_at = CURRENT_TIMESTAMP
                """, (
                    user_id, cand_name, active_cv, primary_stack, default_roles,
                    excluded_keywords, custom_instructions, min_match_score, experience_level,
                    email, phone, current_location, target_locations, expected_salary,
                    work_history, education, bio
                ))
            conn.commit()
            return True

    # ================= User Notification Settings & Alerts =================

    def get_user_notification_settings(self, user_id: int) -> Dict[str, Any]:
        """Loads alert preferences for the specific user."""
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT * FROM user_notification_settings WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                d = dict(row)
                regions = ["all"]
                try:
                    if d.get("preferred_regions"):
                        regions = json.loads(d["preferred_regions"])
                except Exception:
                    regions = ["all"]
                return {
                    "alerts_enabled": bool(d.get("alerts_enabled", 1)),
                    "alert_email": d.get("alert_email") or "",
                    "min_match_score": int(d.get("min_match_score", 70)),
                    "preferred_regions": regions,
                    "frequency": d.get("frequency") or "instant",
                    "last_alert_sent_at": d.get("last_alert_sent_at")
                }

            # Seed default notification settings based on user record and environment
            user = self.get_user_by_id(user_id)
            default_email = ""
            if user:
                default_email = user.get("email") or ""
            if not default_email or "example.com" in default_email or "rateyourcv.com" in default_email:
                default_email = os.environ.get("SMTP_RECIPIENT_EMAIL") or os.environ.get("SMTP_SENDER_EMAIL") or default_email

            defaults = {
                "alerts_enabled": True,
                "alert_email": default_email,
                "min_match_score": 70,
                "preferred_regions": ["all"],
                "frequency": "instant",
                "last_alert_sent_at": None
            }
            self.save_user_notification_settings(user_id, defaults)
            return defaults

    def save_user_notification_settings(self, user_id: int, settings: Dict[str, Any]) -> bool:
        """Saves user notification settings."""
        alerts_enabled = 1 if settings.get("alerts_enabled", True) else 0
        alert_email = str(settings.get("alert_email") or "").strip()
        min_match_score = int(settings.get("min_match_score", 70))
        regions = settings.get("preferred_regions", ["all"])
        if isinstance(regions, list):
            preferred_regions = json.dumps(regions)
        else:
            preferred_regions = json.dumps([str(regions)])
        frequency = str(settings.get("frequency") or "instant").strip().lower()

        with self._get_connection() as conn:
            if self.is_postgres:
                self._execute(conn, """
                INSERT INTO user_notification_settings (
                    user_id, alerts_enabled, alert_email, min_match_score, preferred_regions, frequency, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    alerts_enabled = EXCLUDED.alerts_enabled,
                    alert_email = EXCLUDED.alert_email,
                    min_match_score = EXCLUDED.min_match_score,
                    preferred_regions = EXCLUDED.preferred_regions,
                    frequency = EXCLUDED.frequency,
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, alerts_enabled, alert_email, min_match_score, preferred_regions, frequency))
            else:
                self._execute(conn, """
                INSERT INTO user_notification_settings (
                    user_id, alerts_enabled, alert_email, min_match_score, preferred_regions, frequency, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    alerts_enabled = excluded.alerts_enabled,
                    alert_email = excluded.alert_email,
                    min_match_score = excluded.min_match_score,
                    preferred_regions = excluded.preferred_regions,
                    frequency = excluded.frequency,
                    updated_at = CURRENT_TIMESTAMP
                """, (user_id, alerts_enabled, alert_email, min_match_score, preferred_regions, frequency))
            conn.commit()
            return True

    def get_unnotified_high_match_jobs(
        self, 
        user_id: int, 
        min_match_score: int = 70, 
        region: str = "all", 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieves jobs with match_score >= min_match_score that haven't been notified to this user yet."""
        with self._get_connection() as conn:
            sql = """
            SELECT j.* 
            FROM jobs j
            LEFT JOIN user_job_interactions uji ON (j.id = uji.job_id AND uji.user_id = ?)
            WHERE j.match_score >= ?
              AND COALESCE(uji.status, j.status) != 'trash'
              AND j.id NOT IN (
                  SELECT job_id FROM user_sent_alerts WHERE user_id = ?
              )
            """
            params: List[Any] = [user_id, min_match_score, user_id]

            if region == "gulf":
                sql += " AND j.country != 'Pakistan'"
            elif region == "pakistan":
                sql += " AND j.country = 'Pakistan'"

            sql += " ORDER BY j.match_score DESC, j.created_at DESC LIMIT ?"
            params.append(limit)

            cur = self._execute(conn, sql, tuple(params))
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["missing_keywords"] = json.loads(d.get("missing_keywords") or "[]")
                d["tailored_bullets"] = json.loads(d.get("tailored_bullets") or "[]")
                d["hiring_managers"] = json.loads(d.get("hiring_managers") or "[]")
                results.append(d)
            return results

    def record_sent_alerts(self, user_id: int, job_ids_with_scores: List[Tuple[str, int]]) -> bool:
        """Records jobs in user_sent_alerts and updates last_alert_sent_at."""
        if not job_ids_with_scores:
            return True
        with self._get_connection() as conn:
            for job_id, score in job_ids_with_scores:
                if self.is_postgres:
                    self._execute(conn, """
                    INSERT INTO user_sent_alerts (user_id, job_id, match_score, sent_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, job_id) DO NOTHING
                    """, (user_id, job_id, score))
                else:
                    self._execute(conn, """
                    INSERT OR IGNORE INTO user_sent_alerts (user_id, job_id, match_score, sent_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    """, (user_id, job_id, score))

            self._execute(conn, """
            UPDATE user_notification_settings
            SET last_alert_sent_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            return True

    # ================= User Account Management =================

    def create_user(
        self, 
        username: str, 
        email: str, 
        password_hash: str, 
        full_name: str = "", 
        role: str = "user"
    ) -> Optional[Dict[str, Any]]:
        """Inserts a new user record. Returns user dict on success, None on conflict."""
        u = username.strip().lower()
        e = email.strip().lower()
        name = full_name.strip()
        
        with self._get_connection() as conn:
            try:
                self._execute(conn, """
                INSERT INTO users (username, email, password_hash, full_name, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (u, e, password_hash, name, role))
                conn.commit()
                return self.get_user_by_username(u)
            except Exception:
                return None

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetches user record by username."""
        u = username.strip().lower()
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT * FROM users WHERE LOWER(username) = ?", (u,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fetches user record by email."""
        e = email.strip().lower()
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT * FROM users WHERE LOWER(email) = ?", (e,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Fetches user by either username or email."""
        ident = identifier.strip().lower()
        with self._get_connection() as conn:
            cur = self._execute(
                conn, 
                "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", 
                (ident, ident)
            )
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Fetches user record by ID."""
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT * FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def count_users(self) -> int:
        """Returns total registered users count."""
        with self._get_connection() as conn:
            cur = self._execute(conn, "SELECT COUNT(*) FROM users")
            res = cur.fetchone()
            if isinstance(res, (list, tuple)):
                return res[0]
            elif hasattr(res, "values"):
                return list(res.values())[0]
            elif res is not None:
                return res[0]
            return 0

    def get_user_token_version(self, username: str) -> int:
        """Retrieves user's token version for session revocation tracking."""
        user = self.get_user_by_username(username)
        if user and "token_version" in user and user["token_version"] is not None:
            return int(user["token_version"])
        return 1

    def increment_user_token_version(self, username: str) -> int:
        """Increments token version to immediately invalidate existing sessions."""
        u = username.strip().lower()
        with self._get_connection() as conn:
            self._execute(
                conn, 
                "UPDATE users SET token_version = COALESCE(token_version, 1) + 1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(username) = ?", 
                (u,)
            )
            conn.commit()
            return self.get_user_token_version(u)

    def update_user_password(self, username: str, new_password_hash: str) -> bool:
        """Updates user password hash and increments token version to revoke previous sessions."""
        u = username.strip().lower()
        with self._get_connection() as conn:
            cur = self._execute(
                conn,
                "UPDATE users SET password_hash = ?, token_version = COALESCE(token_version, 1) + 1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(username) = ?",
                (new_password_hash, u)
            )
            conn.commit()
            return True

    def update_user_password_hash(self, username: str, new_password_hash: str) -> bool:
        """Replaces a stored password hash (e.g. legacy -> PBKDF2 upgrade) without revoking sessions."""
        u = username.strip().lower()
        with self._get_connection() as conn:
            self._execute(
                conn,
                "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE LOWER(username) = ?",
                (new_password_hash, u)
            )
            conn.commit()
            return True

    # ================= Subscription & Quota Management =================

    def get_user_search_quota(self, user_id: int) -> Dict[str, Any]:
        """Returns the search usage and quota limits for the specified user."""
        user = self.get_user_by_id(user_id)
        if not user:
            return {
                "searches_count": 0,
                "max_free_searches": 10,
                "is_unlimited": False,
                "searches_remaining": 10,
                "role": "user"
            }
        role = user.get("role", "user") or "user"
        is_unlimited = role in ["admin", "pro"]
        searches_count = int(user.get("searches_count") or 0)
        max_free_searches = int(user.get("max_free_searches") or 10)
        remaining = max(0, max_free_searches - searches_count) if not is_unlimited else 999999
        return {
            "searches_count": searches_count,
            "max_free_searches": max_free_searches,
            "is_unlimited": is_unlimited,
            "searches_remaining": remaining,
            "role": role
        }

    def increment_user_search_count(self, user_id: int) -> int:
        """Increments searches_count by 1 for the user and returns the new count."""
        with self._get_connection() as conn:
            self._execute(
                conn,
                "UPDATE users SET searches_count = COALESCE(searches_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (user_id,)
            )
            conn.commit()
            cur = self._execute(conn, "SELECT searches_count FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                if isinstance(row, (list, tuple)):
                    return int(row[0])
                elif hasattr(row, "values"):
                    return int(list(row.values())[0])
                elif "searches_count" in row:
                    return int(row["searches_count"])
            return 1

    def reset_user_searches(self, user_id: int) -> bool:
        """Resets searches_count to 0 for testing or monthly renewal."""
        with self._get_connection() as conn:
            self._execute(
                conn,
                "UPDATE users SET searches_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (user_id,)
            )
            conn.commit()
            return True

    def update_user_role(self, user_id: int, role: str) -> bool:
        """Updates user subscription role (e.g. 'user', 'pro', 'admin')."""
        role_val = role.strip().lower()
        with self._get_connection() as conn:
            self._execute(
                conn,
                "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (role_val, user_id)
            )
            conn.commit()
            return True


