"""FastAPI Interactive Job Tracker with Trash / Ignore, Restore, Permanent Tech Stack, CV Upload & Multi-Day Filters."""

import os
import re
import secrets
import shutil
import asyncio
import tempfile
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, Depends, status, Response, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from src.database import JobDatabase
from src.job_searcher import GulfJobSearcher
from src.pakistan_job_searcher import PakistanJobSearcher
from src.auth import AuthManager
from src.preferences import load_preferences, save_preferences, get_active_cv_details
from src.cv_parser import CVParser
from src.cv_tailorer import CVTailorer
from main import run_single_pipeline, load_config

app = FastAPI(title="Job Hunter & AI Feedback Tracker (Trash & Restore Support)")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Enforce defensive HTTP security headers against MIME sniffing, clickjacking, XSS, and referrer leakage."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    )
    return response


def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


def test_endpoints_enabled() -> bool:
    """Test-only helpers and self-service plan switching. Never enable in production."""
    return _env_flag("ENABLE_TEST_ENDPOINTS")


def extract_client_ip(request: Request) -> str:
    """Determines the client IP for rate limiting without trusting client-controlled headers.

    Proxy headers are only honoured where the hosting platform guarantees them:
      * CLIENT_IP_HEADER=<header>  explicit override (e.g. "cf-connecting-ip" behind Cloudflare)
      * Vercel                     "x-real-ip" (set by Vercel's edge, not forgeable by clients)
      * Render / TRUSTED_PROXY_HOPS the right-most X-Forwarded-For entries (appended by the proxy)
    Otherwise the TCP peer address is used.
    """
    peer = request.client.host if request.client else "127.0.0.1"

    override = os.environ.get("CLIENT_IP_HEADER", "").strip()
    if override:
        val = request.headers.get(override, "").split(",")[0].strip()
        return val or peer

    if os.environ.get("VERCEL"):
        val = request.headers.get("x-real-ip", "").strip()
        return val or peer

    try:
        hops = int(os.environ.get("TRUSTED_PROXY_HOPS") or (1 if os.environ.get("RENDER") else 0))
    except ValueError:
        hops = 0
    if hops > 0:
        chain = [ip.strip() for ip in request.headers.get("x-forwarded-for", "").split(",") if ip.strip()]
        if len(chain) >= hops:
            return chain[-hops]
    return peer


def verify_request_origin(request: Request):
    """Protects state-changing endpoints against Cross-Site Request Forgery (CSRF)."""
    origin = request.headers.get("origin")
    host = request.headers.get("host")
    forwarded_host = request.headers.get("x-forwarded-host")
    
    if not origin:
        return

    origin_clean = origin.replace("https://", "").replace("http://", "").split("/")[0].lower()
    host_clean = (host or "").split("/")[0].lower()
    fwd_clean = (forwarded_host or "").split("/")[0].lower()

    # 1. Matches host or forwarded host directly
    if origin_clean == host_clean or (fwd_clean and origin_clean == fwd_clean):
        return

    # 2. Local Next.js development and loopback origins (ports 3000, 8000, etc.)
    origin_domain = origin_clean.split(":")[0]
    host_domain = host_clean.split(":")[0]
    if origin_domain in ["localhost", "127.0.0.1", "0.0.0.0"] and host_domain in ["localhost", "127.0.0.1", "0.0.0.0"]:
        return

    # 3. Environment whitelist for production custom domains
    allowed_env = os.environ.get("ALLOWED_ORIGINS", "")
    if allowed_env:
        allowed_list = [o.strip().replace("https://", "").replace("http://", "").split("/")[0].lower() for o in allowed_env.split(",") if o.strip()]
        if origin_clean in allowed_list:
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, 
        detail="Cross-origin request blocked for security."
    )


db = JobDatabase()
config = load_config()
auth = AuthManager(config, db=db)


class LoginPayload(BaseModel):
    username: str = Field(..., max_length=120)
    password: str = Field(..., max_length=128)


class RegisterPayload(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: Optional[str] = Field("", max_length=60)
    honeypot: Optional[str] = Field("", max_length=100)


class ChangePasswordPayload(BaseModel):
    old_password: str = Field(..., max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class StatusUpdate(BaseModel):
    status: str


class FeedbackUpdate(BaseModel):
    rating: str
    notes: Optional[str] = ""


class PreferencesPayload(BaseModel):
    candidate_name: Optional[str] = "Candidate"
    active_cv: Optional[str] = ""
    primary_stack: Optional[List[str]] = []
    default_roles: Optional[List[str]] = []
    custom_instructions: Optional[str] = ""
    excluded_keywords: Optional[List[str]] = []
    min_match_score: Optional[int] = 55
    experience_level: Optional[str] = "Mid-Senior"
    email: Optional[str] = ""
    phone: Optional[str] = ""
    current_location: Optional[str] = "Pakistan"
    target_locations: Optional[List[str]] = ["Pakistan", "United Arab Emirates", "Saudi Arabia"]
    expected_salary: Optional[str] = ""
    work_history: Optional[List[Dict[str, Any]]] = []
    education: Optional[List[Dict[str, Any]]] = []
    bio: Optional[str] = ""


class ATSScanRequest(BaseModel):
    cv_text: Optional[str] = ""
    job_description: str
    job_title: Optional[str] = ""
    company: Optional[str] = ""
    use_active_cv: Optional[bool] = False


def get_current_user(request: Request) -> str:
    if not auth.enabled:
        return "admin"
    vault_token = request.cookies.get("tr_acct")
    if vault_token:
        auth.rehydrate_account_vault(vault_token)
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return username


def get_current_user_profile(request: Request) -> Dict[str, Any]:
    """Retrieves full user record including integer user ID for data isolation."""
    username = get_current_user(request)
    profile = auth.get_user_profile(username)
    if not auth.enabled and not profile:
        # Single-user mode with authentication explicitly disabled
        return {"id": 1, "username": username, "full_name": username.title(), "role": "admin"}
    if not profile or not profile.get("id"):
        # Never fall back to another account's data (e.g. user 1 / admin)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please log in again."
        )
    return profile


def require_admin(user_profile: Dict[str, Any] = Depends(get_current_user_profile)) -> Dict[str, Any]:
    if (user_profile.get("role") or "user") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return user_profile


def get_optional_user_profile(request: Request) -> Optional[Dict[str, Any]]:
    """Retrieves user profile if session token is valid, else returns None without raising 401."""
    vault_token = request.cookies.get("tr_acct")
    if vault_token:
        auth.rehydrate_account_vault(vault_token)
    token = request.cookies.get("session_token")
    if not token:
        return None
    username = auth.verify_session_token(token)
    if not username:
        return None
    profile = auth.get_user_profile(username)
    if not profile or not profile.get("id"):
        return None
    return profile


def get_user_cv_details(user_id: int, active_cv: Optional[str]) -> Dict[str, Any]:
    """Inspects and parses user-specific active CV from isolated storage."""
    cv_filename = active_cv or ""
    user_resumes_dir = Path("data/resumes/users") / str(user_id)
    target_path = user_resumes_dir / cv_filename if cv_filename else None

    if target_path and target_path.exists():
        parser = CVParser()
        try:
            text = parser.extract_text(str(target_path))
            parsed = parser.parse_profile(text)
            return {
                "filename": cv_filename,
                "candidate_name": parsed.get("name", ""),
                "skills": parsed.get("skills", []),
                "raw_length": len(text)
            }
        except Exception:
            pass

    # Graceful fallback to shared seed resume if user has not yet uploaded one
    return get_active_cv_details()


@app.post("/api/register")
async def register_api(payload: RegisterPayload, request: Request, response: Response):
    verify_request_origin(request)

    # Bot honeypot verification
    if payload.honeypot and payload.honeypot.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration request could not be validated."
        )

    client_ip = extract_client_ip(request)

    # Registration rate limiting (max 5 accounts per 15 min per IP)
    allowed_reg, reg_msg = auth.check_registration_rate_limit(client_ip)
    if not allowed_reg:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=reg_msg
        )

    allowed, rate_msg = auth.check_rate_limit(client_ip, payload.username)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_msg
        )

    try:
        user = auth.register_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name or ""
        )
    except ValueError as ve:
        auth.record_failed_attempt(client_ip, payload.username)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        auth.record_failed_attempt(client_ip, payload.username)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")

    auth.reset_failed_attempts(client_ip, payload.username)
    auth.record_registration_attempt(client_ip)

    # Automatically log the user in after registration
    token = auth.create_session_token(user["username"])
    vault_token = auth.create_account_vault_token(user["username"])
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=auth.session_duration_hours * 3600,
        samesite="lax",
        secure=is_secure,
        path="/"
    )
    if vault_token:
        response.set_cookie(
            key="tr_acct",
            value=vault_token,
            httponly=True,
            max_age=365 * 24 * 3600,
            samesite="lax",
            secure=is_secure,
            path="/"
        )
    return {
        "status": "success",
        "message": "Account created successfully! Welcome to TalentRadar.",
        "user": user
    }


@app.post("/api/login")
async def login_api(payload: LoginPayload, request: Request, response: Response):
    verify_request_origin(request)

    vault_token_cookie = request.cookies.get("tr_acct")
    if vault_token_cookie:
        auth.rehydrate_account_vault(vault_token_cookie)

    client_ip = extract_client_ip(request)
    
    allowed, rate_msg = auth.check_rate_limit(client_ip, payload.username)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_msg
        )

    user = auth.authenticate(payload.username, payload.password)
    if not user:
        auth.record_failed_attempt(client_ip, payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Reset failed attempts counter upon successful authentication
    auth.reset_failed_attempts(client_ip, payload.username)

    username = user["username"]
    token = auth.create_session_token(username)
    new_vault = auth.create_account_vault_token(username)
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=auth.session_duration_hours * 3600,
        samesite="lax",
        secure=is_secure,
        path="/"
    )
    if new_vault:
        response.set_cookie(
            key="tr_acct",
            value=new_vault,
            httponly=True,
            max_age=365 * 24 * 3600,
            samesite="lax",
            secure=is_secure,
            path="/"
        )
    return {
        "status": "success", 
        "message": "Login successful", 
        "username": username,
        "user": user
    }


@app.post("/api/change-password")
async def change_password_api(
    payload: ChangePasswordPayload, 
    request: Request,
    response: Response,
    current_user: str = Depends(get_current_user)
):
    verify_request_origin(request)
    success, msg = auth.change_password(current_user, payload.old_password, payload.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Issue fresh token with incremented token_version
    new_token = auth.create_session_token(current_user)
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.set_cookie(
        key="session_token",
        value=new_token,
        httponly=True,
        max_age=auth.session_duration_hours * 3600,
        samesite="lax",
        secure=is_secure,
        path="/"
    )
    return {"status": "success", "message": msg}


@app.get("/api/me")
async def get_me(user: str = Depends(get_current_user)):
    """Returns the authenticated user's profile with subscription quota."""
    profile = auth.get_user_profile(user)
    if not profile:
        profile = {"username": user, "full_name": user.title(), "role": "user"}
    user_id = profile.get("id") or 1
    quota = db.get_user_search_quota(user_id)
    profile.update({
        "searches_count": quota["searches_count"],
        "max_free_searches": quota["max_free_searches"],
        "searches_remaining": quota["searches_remaining"],
        "is_unlimited": quota["is_unlimited"],
        "is_pro": quota["is_unlimited"]
    })
    return {"status": "success", "user": profile}


@app.post("/api/logout")
@app.get("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    if username:
        auth.revoke_user_sessions(username)

    res = RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    res.delete_cookie("session_token", path="/")
    return res


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    token = request.cookies.get("session_token")
    if auth.verify_session_token(token):
        return RedirectResponse(url="/app", status_code=status.HTTP_302_FOUND)

    template_path = Path("templates/login.html")
    if template_path.exists():
        html_content = template_path.read_text(encoding="utf-8")
    else:
        html_content = "<h2>Login template missing</h2>"
    return HTMLResponse(content=html_content)


@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    token = request.cookies.get("session_token")
    if auth.verify_session_token(token):
        return RedirectResponse(url="/app", status_code=status.HTTP_302_FOUND)

    template_path = Path("templates/register.html")
    if template_path.exists():
        html_content = template_path.read_text(encoding="utf-8")
    else:
        html_content = "<h2>Register template missing</h2>"
    return HTMLResponse(content=html_content)


@app.get("/api/stats")
async def get_stats(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    return db.get_stats(user_id=user_id)


@app.get("/api/jobs")
async def get_jobs(
    region: Optional[str] = "all",
    status: Optional[str] = "all",
    time_filter: Optional[str] = "all",
    search: Optional[str] = "",
    min_score: Optional[int] = 0,
    page: Optional[int] = 1,
    limit: Optional[int] = None,
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    if not user_profile:
        # Public visitor browsing open roles
        jobs = db.get_jobs(
            user_id=1,
            region=region,
            status=status,
            time_filter=time_filter,
            search=search,
            min_score=min_score,
            page=page,
            limit=limit or 30
        )
        for j in jobs:
            apply_url = str(j.get("apply_url") or "").strip()
            if not (apply_url.startswith("http://") or apply_url.startswith("https://")):
                j["apply_url"] = "#"
        return jobs

    user_id = user_profile.get("id") or 1
    role = user_profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    # Search Quota enforcement for free users (max 10 searches)
    search_term = (search or "").strip()
    if search_term and not is_pro:
        quota = db.get_user_search_quota(user_id)
        if quota["searches_count"] >= quota["max_free_searches"]:
            raise HTTPException(
                status_code=403,
                detail=f"Free search limit reached ({quota['searches_count']}/{quota['max_free_searches']} searches used). Upgrade to TalentRadar Pro for unlimited searches and full direct access."
            )
        db.increment_user_search_count(user_id)

    jobs = db.get_jobs(
        user_id=user_id,
        region=region,
        status=status,
        time_filter=time_filter,
        search=search,
        min_score=min_score,
        page=page,
        limit=limit
    )

    p = max(int(page or 1), 1)

    # Defensively sanitize URLs and enforce strict freemium gating
    if not is_pro:
        # Free users only get top 3 results in full, plus 1 locked sample teaser
        if p > 1:
            return []

        gated_jobs = []
        for idx, j in enumerate(jobs[:4]):
            apply_url = str(j.get("apply_url") or "").strip()
            if not (apply_url.startswith("http://") or apply_url.startswith("https://")):
                j["apply_url"] = "#"
            for hm in j.get("hiring_managers", []):
                hm_url = str(hm.get("linkedin_url") or "").strip()
                if not (hm_url.startswith("http://") or hm_url.startswith("https://")):
                    hm["linkedin_url"] = "#"

            if idx < 3:
                j["is_locked"] = False
            else:
                j["is_locked"] = True
                # Mask sensitive fields to protect premium data from browser inspection
                j["apply_url"] = ""
                j["tailored_headline"] = "🔒 Pro Feature - Upgrade to unlock tailored resume headline"
                j["tailored_bullets"] = []
                j["hiring_managers"] = []
                desc = j.get("description") or ""
                j["description"] = (desc[:140] + "... [Full specification locked for Free tier. Upgrade to Pro to view.]") if desc else ""
                summary = j.get("summary") or ""
                j["summary"] = (summary[:110] + "... [Pro member only]") if summary else ""
            gated_jobs.append(j)
        return gated_jobs
    else:
        for j in jobs:
            apply_url = str(j.get("apply_url") or "").strip()
            if not (apply_url.startswith("http://") or apply_url.startswith("https://")):
                j["apply_url"] = "#"
            for hm in j.get("hiring_managers", []):
                hm_url = str(hm.get("linkedin_url") or "").strip()
                if not (hm_url.startswith("http://") or hm_url.startswith("https://")):
                    hm["linkedin_url"] = "#"
            j["is_locked"] = False
        return jobs


@app.get("/api/jobs/{job_id}")
async def get_single_job(job_id: str):
    """Public endpoint to fetch a single job for Google SEO and direct candidate links."""
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    apply_url = str(job.get("apply_url") or "").strip()
    if not (apply_url.startswith("http://") or apply_url.startswith("https://")):
        job["apply_url"] = "#"
    return job


@app.post("/api/jobs/{job_id}/status")
async def update_status(job_id: str, payload: StatusUpdate, user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    success = db.update_job_status(job_id, payload.status, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "new_status": payload.status}


@app.delete("/api/jobs/{job_id}")
async def delete_job_api(job_id: str, admin_profile: Dict[str, Any] = Depends(require_admin)):
    """Permanently deletes a job for ALL users. Admin only; regular users should move jobs to trash."""
    success = db.delete_job_permanently(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "message": "Job permanently deleted."}


@app.post("/api/jobs/{job_id}/feedback")
async def submit_feedback(job_id: str, payload: FeedbackUpdate, user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    return db.set_feedback(job_id, payload.rating, payload.notes or "", user_id=user_id)


@app.get("/api/preferences")
async def get_prefs(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    prefs = db.get_user_preferences(user_id)
    cv_info = get_user_cv_details(user_id, prefs.get("active_cv"))
    return {"preferences": prefs, "active_cv": cv_info}


@app.post("/api/preferences")
async def update_prefs(payload: PreferencesPayload, user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    db.save_user_preferences(user_id, payload.model_dump(exclude_unset=True))
    return {"status": "success", "message": "Preferences and Permanent Tech Stack updated successfully."}


@app.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...), user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    user_id = user_profile.get("id") or 1
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Please upload PDF, DOCX, or TXT.")

    # Isolate uploaded CV inside user-specific directory
    user_resumes_dir = Path("data/resumes/users") / str(user_id)
    user_resumes_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Path traversal prevention & safe filename generation
    raw_base_name = Path(file.filename).name
    clean_stem = re.sub(r'[^a-zA-Z0-9_\-]', '_', Path(raw_base_name).stem).strip('_')
    if not clean_stem:
        clean_stem = f"resume_{secrets.token_hex(4)}"
    safe_filename = f"{clean_stem}{ext}"
    target_path = user_resumes_dir / safe_filename

    # 2. Maximum file size cap (5 MB) to prevent disk/memory exhaustion DoS
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    total_bytes = 0

    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = await file.read(64 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE:
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed size of 5 MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    parser = CVParser()
    try:
        text = parser.extract_text(str(target_path))
        parsed_profile = parser.parse_profile(text)
        detected_skills = parsed_profile.get("skills", [])
        
        prefs = db.get_user_preferences(user_id)
        existing_stack = prefs.get("primary_stack", [])
        updated_stack = list(set(existing_stack + detected_skills)) if detected_skills else existing_stack

        cand_name = parsed_profile.get("name") or user_profile.get("full_name") or user_profile.get("username")
        prefs.update({
            "active_cv": safe_filename,
            "candidate_name": cand_name,
            "primary_stack": updated_stack
        })
        db.save_user_preferences(user_id, prefs)

        return {
            "status": "success",
            "filename": safe_filename,
            "candidate_name": cand_name,
            "skills": detected_skills,
            "message": f"Successfully parsed {safe_filename} and synced detected skills!"
        }
    except Exception as e:
        prefs = db.get_user_preferences(user_id)
        prefs["active_cv"] = safe_filename
        db.save_user_preferences(user_id, prefs)
        return {
            "status": "success",
            "filename": safe_filename,
            "candidate_name": user_profile.get("full_name") or "Candidate",
            "skills": ["Python", "Django"],
            "message": f"Saved {safe_filename} as active resume."
        }


def _run_scan_background(region: str, time_window: str, user_id: Optional[int] = None):
    try:
        prefs = load_preferences()
        roles = prefs.get("default_roles", ["Python Developer", "Django Developer", "Full Stack Engineer"])
        cv_filename = prefs.get("active_cv", "Jamshaid_Ali_Python_Django-5.pdf")
        cv_path = f"data/resumes/{cv_filename}"
        if not Path(cv_path).exists():
            cv_path = ""

        if region in ["all", "gulf"]:
            gulf_searcher = GulfJobSearcher()
            run_single_pipeline("gulf", "Gulf Region", "🌴", gulf_searcher, cv_path, roles, limit=15, send_notify=False, only_unseen=False)

        if region in ["all", "pakistan"]:
            pk_searcher = PakistanJobSearcher()
            run_single_pipeline("pakistan", "Pakistan & Lahore Tech", "🇵🇰", pk_searcher, cv_path, roles, limit=15, send_notify=False, only_unseen=False)

        # Automatically evaluate and dispatch high-match alerts to user if enabled
        if user_id:
            try:
                from src.alert_service import send_high_match_alert
                send_high_match_alert(user_id=user_id, test_mode=False)
            except Exception as notify_err:
                print(f"[!] Auto-alert dispatch error after scan: {notify_err}")

    except Exception as e:
        print(f"[!] Background scan error: {e}")


@app.post("/api/scan")
async def trigger_scan(
    background_tasks: BackgroundTasks,
    region: str = "all",
    time_window: str = "week",
    user_profile: Dict[str, Any] = Depends(get_current_user_profile)
):
    user_id = user_profile.get("id") or 1
    role = user_profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    if not is_pro:
        quota = db.get_user_search_quota(user_id)
        if quota["searches_count"] >= quota["max_free_searches"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Free search & scan quota reached ({quota['searches_count']}/{quota['max_free_searches']}). Upgrade to TalentRadar Pro for unlimited scans."
            )
        db.increment_user_search_count(user_id)

    background_tasks.add_task(_run_scan_background, region, time_window, user_id)
    return {
        "status": "started",
        "message": "Scan launched in the background. Your dashboard will auto-refresh live!"
    }


# ================= ATS Resume Scanner & Diagnostic Endpoints =================

SAMPLE_ATS_JOB = {
    "job_title": "Senior Backend Engineer (Python & Distributed Cloud Systems)",
    "company": "Stripe - Remote & Hybrid",
    "job_description": (
        "We are looking for a Senior Backend Engineer to design and scale our mission-critical payments and financial infrastructure platform.\n\n"
        "Responsibilities:\n"
        "- Architect, build, and maintain high-throughput microservices using Python (FastAPI/Django) and Golang.\n"
        "- Scale our distributed real-time messaging pipelines using Apache Kafka, RabbitMQ, and Redis.\n"
        "- Deploy and manage containerized services on AWS using Docker and Kubernetes (EKS) with automated CI/CD pipelines.\n"
        "- Collaborate closely with cross-functional teams in an Agile/Scrum environment to deliver scalable fintech solutions.\n"
        "- Lead technical architecture reviews, code reviews, and mentor mid-level software engineers.\n\n"
        "Requirements:\n"
        "- 5+ years of production experience in backend software engineering.\n"
        "- Strong proficiency in Python, FastAPI, Django, and RESTful API design.\n"
        "- Hands-on experience with cloud infrastructure (AWS or GCP), Docker, Kubernetes, and Terraform.\n"
        "- Solid background in distributed streaming systems: Kafka, Redis, and relational databases (PostgreSQL, MySQL).\n"
        "- Track record of performance optimization, unit testing (Pytest), and system design for high-concurrency workloads.\n"
        "- Excellent communication, analytical problem solving, and ownership mindset."
    ),
    "sample_cv": (
        "Alexander Chen\n"
        "alex.chen@talentradar.pro | +1 (555) 234-5678 | Open to Remote & Hybrid\n"
        "linkedin.com/in/alexchen | github.com/alexchen\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Accomplished Senior Backend Engineer with 6+ years of experience architecting resilient microservices and distributed backend systems using Python, FastAPI, and Django. Proven record of cutting API latency by 45% and scaling enterprise applications to support 2M+ active daily users.\n\n"
        "CORE TECHNICAL SKILLS\n"
        "Languages: Python, SQL, JavaScript, Bash\n"
        "Frameworks & APIs: FastAPI, Django, Flask, REST API, WebSockets\n"
        "Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, GitHub Actions, Linux\n"
        "Databases & Streaming: PostgreSQL, MySQL, Redis, Celery, Kafka\n"
        "Methodologies: Agile, Scrum, TDD, Pytest, Microservices, System Design\n\n"
        "PROFESSIONAL EXPERIENCE\n"
        "Senior Backend Developer | FinTech Cloud Solutions (Remote) | 2022 – Present\n"
        "- Architected high-concurrency payment gateway processing $15M+ in monthly transactions with 99.99% uptime.\n"
        "- Optimized PostgreSQL queries and implemented Redis caching, slashing p99 response times from 350ms to 42ms.\n"
        "- Engineered automated CI/CD deployment pipelines using Docker and AWS EKS, reducing deployment cycle times by 60%.\n"
        "- Mentored a cross-functional squad of 5 engineers and spearheaded weekly architecture reviews and code audits.\n\n"
        "Software Engineer | Apex Enterprise Systems (Hybrid) | 2019 – 2022\n"
        "- Built RESTful APIs and distributed task workers with Python, Django, and Celery for enterprise SaaS platforms.\n"
        "- Developed automated test suites with Pytest achieving 92% code coverage, cutting bug reports by 35%.\n\n"
        "EDUCATION\n"
        "Bachelor of Science in Computer Science (BSCS) | Institute of Technology"
    )
}


@app.get("/api/ats/sample")
async def get_ats_sample():
    """Returns sample Tech job description and resume for 1-click ATS scanner demo."""
    return {
        "status": "success",
        "data": SAMPLE_ATS_JOB
    }


@app.post("/api/ats/scan")
async def scan_ats_json(
    payload: ATSScanRequest,
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    """Evaluates CV text against a Job Description and returns detailed ATS score, missing keywords, and tailored bullets."""
    cv_text = (payload.cv_text or "").strip()
    jd = (payload.job_description or "").strip()

    if not jd:
        raise HTTPException(status_code=400, detail="Target job description is required.")

    # If CV text was omitted or user selected 'use active CV', retrieve active CV on file
    if (not cv_text or payload.use_active_cv) and user_profile:
        user_id = user_profile.get("id") or 1
        prefs = db.get_user_preferences(user_id)
        active_cv = prefs.get("active_cv")
        if active_cv:
            user_path = Path("data/resumes/users") / str(user_id) / active_cv
            global_path = Path("data/resumes") / active_cv
            target_path = user_path if user_path.exists() else (global_path if global_path.exists() else None)
            if target_path:
                try:
                    parser = CVParser()
                    cv_text = parser.extract_text(str(target_path))
                except Exception as e:
                    print(f"[!] Error parsing active CV: {e}")

    if not cv_text:
        raise HTTPException(
            status_code=400,
            detail="Please provide CV text, upload a resume file, or select your active CV."
        )

    tailorer = CVTailorer()
    results = tailorer.evaluate_ats_fit(
        cv_text=cv_text,
        job_description=jd,
        job_title=payload.job_title or "",
        company=payload.company or ""
    )
    parser = CVParser()
    results["parsed_resume"] = parser.parse_structured_resume(cv_text)
    results["source_filename"] = "Scanned_Resume.txt"
    return {
        "status": "success",
        "results": results
    }


@app.post("/api/ats/scan-upload")
async def scan_ats_upload(
    file: Optional[UploadFile] = File(None),
    cv_text: Optional[str] = Form(None),
    job_description: str = Form(...),
    job_title: Optional[str] = Form(""),
    company: Optional[str] = Form(""),
    use_active_cv: Optional[bool] = Form(False),
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    """Evaluates an uploaded CV file (.pdf, .docx, .txt) against a Job Description."""
    final_cv_text = (cv_text or "").strip()
    jd = (job_description or "").strip()

    if not jd:
        raise HTTPException(status_code=400, detail="Target job description is required.")

    if file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported resume file type '{ext}'. Please upload PDF, DOCX, or TXT."
            )

        temp_dir = Path(tempfile.gettempdir()) / "talentradar_uploads"
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_file = temp_dir / f"scan_{secrets.token_hex(8)}{ext}"
        try:
            content = await file.read()
            if len(content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Uploaded CV exceeds maximum allowed size of 5 MB.")
            with open(temp_file, "wb") as f:
                f.write(content)
            parser = CVParser()
            final_cv_text = parser.extract_text(str(temp_file))
        finally:
            if temp_file.exists():
                temp_file.unlink()

    elif not final_cv_text and use_active_cv and user_profile:
        user_id = user_profile.get("id") or 1
        prefs = db.get_user_preferences(user_id)
        active_cv = prefs.get("active_cv")
        if active_cv:
            user_path = Path("data/resumes/users") / str(user_id) / active_cv
            global_path = Path("data/resumes") / active_cv
            target_path = user_path if user_path.exists() else (global_path if global_path.exists() else None)
            if target_path:
                parser = CVParser()
                final_cv_text = parser.extract_text(str(target_path))

    if not final_cv_text:
        raise HTTPException(
            status_code=400,
            detail="Please provide CV text or upload a resume file."
        )

    tailorer = CVTailorer()
    results = tailorer.evaluate_ats_fit(
        cv_text=final_cv_text,
        job_description=jd,
        job_title=job_title or "",
        company=company or ""
    )
    parser = CVParser()
    results["parsed_resume"] = parser.parse_structured_resume(final_cv_text)
    results["source_filename"] = file.filename if (file and file.filename) else "Uploaded_Resume.pdf"
    return {
        "status": "success",
        "results": results
    }


@app.post("/api/builder/import-cv")
async def import_cv_to_builder(
    file: Optional[UploadFile] = File(None),
    cv_text: Optional[str] = Form(None),
    use_sample: Optional[bool] = Form(False),
):
    """
    Parses an uploaded PDF, DOCX, DOC, TXT, or MD resume file (or pasted resume text)
    and returns structured fields (fullName, jobTitle, email, phone, location, linkedIn,
    github, summary, skills, experiences, educations, projects) to auto-fill the Live Visual Builder.
    """
    extracted_text = (cv_text or "").strip()

    if use_sample and not extracted_text and not (file and file.filename):
        extracted_text = SAMPLE_ATS_JOB["sample_cv"]

    if file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Please upload a PDF, DOCX, or TXT resume."
            )

        temp_dir = Path(tempfile.gettempdir()) / "talentradar_uploads"
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_file = temp_dir / f"import_{secrets.token_hex(8)}{ext}"
        try:
            content = await file.read()
            if len(content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Uploaded resume exceeds maximum allowed size of 5 MB.")
            with open(temp_file, "wb") as f:
                f.write(content)
            parser = CVParser()
            extracted_text = parser.extract_text(str(temp_file))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not extract text from resume file: {str(e)}")
        finally:
            if temp_file.exists():
                temp_file.unlink()

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF, DOCX, or TXT resume file, or paste your resume text."
        )

    parser = CVParser()
    structured = parser.parse_structured_resume(extracted_text)
    return {
        "status": "success",
        "filename": file.filename if (file and file.filename) else "pasted_resume.txt",
        "resume": structured,
    }


# ================= Notification & Alert Endpoints =================

@app.get("/api/notifications/settings")
async def get_notification_settings(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Retrieves the current user's automated alert and digest settings."""
    user_id = user_profile.get("id") or 1
    settings = db.get_user_notification_settings(user_id)
    return {
        "status": "success",
        "settings": settings
    }


@app.post("/api/notifications/settings")
async def update_notification_settings(
    settings_payload: Dict[str, Any],
    user_profile: Dict[str, Any] = Depends(get_current_user_profile)
):
    """Updates the user's automated alert preferences (threshold, email, frequency)."""
    user_id = user_profile.get("id") or 1
    db.save_user_notification_settings(user_id, settings_payload)
    updated = db.get_user_notification_settings(user_id)
    return {
        "status": "success",
        "message": "Notification preferences updated successfully!",
        "settings": updated
    }


@app.post("/api/notifications/test")
async def trigger_test_alert(
    payload: Optional[Dict[str, Any]] = None,
    user_profile: Dict[str, Any] = Depends(get_current_user_profile)
):
    """Dispatches a test high-match alert email immediately to verify email delivery."""
    user_id = user_profile.get("id") or 1
    custom_recipient = (payload.get("email") or "").strip() if payload else ""
    if custom_recipient:
        # Only allow addresses already tied to this account, so the endpoint can't be used to spam others
        own_addresses = {
            (user_profile.get("email") or "").strip().lower(),
            (db.get_user_notification_settings(user_id).get("alert_email") or "").strip().lower(),
        } - {""}
        if custom_recipient.lower() not in own_addresses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Test alerts can only be sent to your account email or your saved alert email."
            )
    custom_recipient = custom_recipient or None
    
    from src.alert_service import send_high_match_alert
    res = send_high_match_alert(user_id=user_id, test_mode=True, custom_recipient=custom_recipient)
    
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res.get("message", "Failed to dispatch test alert email."))
    
    return res


@app.post("/api/notifications/send-digest")
async def trigger_digest_dispatch(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Triggers an immediate evaluation and digest dispatch for unnotified high-match opportunities."""
    user_id = user_profile.get("id") or 1
    from src.alert_service import send_high_match_alert
    res = send_high_match_alert(user_id=user_id, test_mode=False)
    return res


@app.post("/api/cover-letter/{job_id}")
async def generate_cover_letter(job_id: str, user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Generates an ATS-tailored cover letter customized for the specific job and candidate profile."""
    user_id = user_profile.get("id") or 1
    role = user_profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    if not is_pro:
        top_jobs = db.get_jobs(user_id=user_id, limit=3)
        top_ids = {j["id"] for j in top_jobs}
        if job_id not in top_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This opportunity is locked on the Free tier. Upgrade to TalentRadar Pro to unlock AI recruiter outreach and 1-click ATS kits."
            )

    job = db.get_job(job_id, user_id=user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job record not found")

    prefs = db.get_user_preferences(user_id)
    candidate_name = prefs.get("candidate_name") or user_profile.get("full_name") or user_profile.get("username") or "Candidate"
    stack = ", ".join(prefs.get("primary_stack") or ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS"])
    
    title = job.get("title", "Software Engineer")
    company = job.get("company", "Hiring Team")
    location = job.get("location", "the Gulf Region")
    bullets = job.get("tailored_bullets", [])
    bullet_snippet = bullets[0].get("suggested_bullet", "") if bullets else f"Architected high-performance software systems leveraging {stack}."

    cover_letter = f"""Dear {company} Hiring Team,

I am writing to express my strong enthusiasm for the {title} role in {location}. Having specialized in scalable software architecture and high-performance engineering, I was immediately drawn to {company}'s engineering focus and commitment to technical excellence.

My core technical competencies center on {stack}. Throughout my career, I have prioritized clean architecture, system reliability, and business impact. Specifically, I have {bullet_snippet.lower() if bullet_snippet.startswith('A') or bullet_snippet.startswith('E') else bullet_snippet}.

Given the requirements outlined for the {title} position, I am confident that my technical problem-solving capabilities, backend architecture background, and experience delivering production systems make me an immediate contributor to your engineering organization.

I would welcome the opportunity to discuss how my skill set and background align with {company}'s roadmap and engineering initiatives.

Thank you for your time and consideration.

Sincerely,
{candidate_name}"""

    return {"status": "success", "job_id": job_id, "cover_letter": cover_letter}


@app.post("/api/recruiter-outreach/{job_id}")
async def generate_recruiter_outreach(job_id: str, user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Generates a customized 300-char LinkedIn connection note and full cold outreach email draft for recruiters."""
    user_id = user_profile.get("id") or 1
    role = user_profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    if not is_pro:
        top_jobs = db.get_jobs(user_id=user_id, limit=3)
        top_ids = {j["id"] for j in top_jobs}
        if job_id not in top_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This opportunity is locked on the Free tier. Upgrade to TalentRadar Pro to unlock direct recruiter contact and cold outreach templates."
            )

    job = db.get_job(job_id, user_id=user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job record not found")

    prefs = db.get_user_preferences(user_id)
    candidate_name = prefs.get("candidate_name") or user_profile.get("full_name") or user_profile.get("username") or "Candidate"
    stack_list = prefs.get("primary_stack") or ["Python", "Backend Architecture"]
    stack = ", ".join(stack_list[:3])
    title = job.get("title", "Software Engineer")
    company = job.get("company", "Hiring Team")
    managers = job.get("hiring_managers", [])
    recruiter_name = managers[0].get("name", "Hiring Manager") if managers else "Hiring Lead"
    recruiter_first_name = recruiter_name.split()[0] if recruiter_name else "there"

    # 1. High-converting LinkedIn 300-character connection request note
    li_note = f"Hi {recruiter_first_name}, saw the {title} role at {company}. Experienced in {stack}, I build scalable systems that align directly with your engineering focus. I’d love to connect and share my portfolio. Best, {candidate_name}"
    if len(li_note) > 300:
        li_note = f"Hi {recruiter_first_name}, saw the {title} opening at {company}. With deep background in {stack}, I’d love to connect and discuss how I can contribute! - {candidate_name}"
    if len(li_note) > 300:
        li_note = li_note[:297] + "..."

    # 2. Comprehensive Cold Email / InMail draft
    email_draft = f"""Subject: Technical Alignment for {title} Opening at {company}

Dear {recruiter_name},

I hope this message finds you well.

I recently reviewed the {title} opening at {company} and wanted to reach out directly. My core engineering background focuses on {stack}, specializing in building high-throughput services, clean architecture, and reliable production systems.

At {company}, technical velocity and system stability are clearly paramount. Given my experience delivering production systems, I believe I can make an immediate, positive impact on your sprint goals and engineering roadmap.

I have submitted my application through the portal and would welcome a brief 10-minute conversation this week to discuss how my skill set can accelerate your team's initiatives.

Thank you for your time,
{candidate_name}"""

    return {
        "status": "success",
        "job_id": job_id,
        "recruiter_name": recruiter_name,
        "linkedin_note": li_note,
        "email_draft": email_draft
    }


# ================= ATS-Tailored CV / Resume Export & 100+ Templates Endpoints =================

@app.get("/api/cv/templates")
async def get_cv_templates(category: Optional[str] = None):
    """Returns the catalog of 105+ professional ATS-compliant CV templates with colors and layouts."""
    from src.cv_templates import list_templates, CATEGORIES
    templates = list_templates(category)
    return {
        "status": "success",
        "total_templates": len(templates),
        "categories": ["All"] + CATEGORIES,
        "templates": templates
    }


class CustomCVExportRequest(BaseModel):
    format: Optional[str] = "pdf"
    template_id: Optional[str] = "gulf_dubai_sapphire"
    job_title: Optional[str] = ""
    company: Optional[str] = ""
    parsed_resume: Optional[Dict[str, Any]] = None
    tailored_summary: Optional[str] = ""
    tailored_bullets: Optional[List[Any]] = None
    missing_keywords: Optional[List[str]] = None
    # Optional look overrides so the file matches the builder preview exactly.
    accent_color: Optional[str] = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    font: Optional[str] = Field(default=None, pattern=r"^(sans|serif|mono)$")
    # Optional profile photo (data URL) for the designer layouts; validated and re-encoded server-side.
    photo: Optional[str] = Field(default=None, max_length=1_500_000)


@app.post("/api/ats/export-cv")
async def export_custom_ats_cv(
    payload: CustomCVExportRequest,
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    """Exports an ATS-optimized PDF or DOCX resume directly from the ATS Scanner or Builder using the candidate's parsed CV."""
    user_id = (user_profile.get("id") if user_profile else None) or 1
    profile = user_profile or {"id": user_id, "username": "candidate", "full_name": "Candidate"}
    prefs = db.get_user_preferences(user_id) if user_profile else {}

    parsed = payload.parsed_resume or {}
    target_role = (
        (payload.job_title or "").strip()
        or (parsed.get("jobTitle") or "").strip()
    )
    target_company = (payload.company or "").strip()
    tmpl_id = (payload.template_id or "gulf_dubai_sapphire").strip()
    fmt = (payload.format or "pdf").strip().lower()

    synthetic_job = {
        "id": "custom_ats_scan",
        "title": target_role,
        "company": target_company,
        "parsed_resume": parsed,
        "tailored_summary": payload.tailored_summary or "",
        "tailored_bullets": payload.tailored_bullets or [],
        "missing_keywords": payload.missing_keywords or [],
    }

    cand_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', str(parsed.get("fullName") or profile.get("full_name") or "Tailored_CV")).strip('_') or "Tailored_CV"
    tmpl_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', tmpl_id)

    if fmt == "docx":
        from src.cv_exporter import generate_tailored_docx
        docx_bytes = generate_tailored_docx(
            synthetic_job,
            profile,
            prefs,
            template_id=tmpl_id,
            parsed_resume=parsed,
            accent_color=payload.accent_color,
            font=payload.font,
            photo=payload.photo,
        )
        filename = f"{cand_slug}_{tmpl_slug}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    else:
        from src.cv_exporter import generate_tailored_pdf
        pdf_bytes = generate_tailored_pdf(
            synthetic_job,
            profile,
            prefs,
            template_id=tmpl_id,
            parsed_resume=parsed,
            accent_color=payload.accent_color,
            font=payload.font,
            photo=payload.photo,
        )
        filename = f"{cand_slug}_{tmpl_slug}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )


@app.get("/api/cv/export-pdf/{job_id}")
async def export_tailored_pdf(
    job_id: str, 
    template: Optional[str] = "gulf_dubai_sapphire",
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    """Exports an ATS-optimized PDF resume tailored specifically for the target role and company in the selected template design."""
    user_id = (user_profile.get("id") if user_profile else None) or 1
    profile = user_profile or {"id": user_id, "username": "candidate", "full_name": "Candidate"}
    role = profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    if job_id == "custom_ats_scan":
        job = {
            "id": "custom_ats_scan",
            "title": "Senior Software Engineer",
            "company": "",
        }
    else:
        if user_profile and not is_pro:
            top_jobs = db.get_jobs(user_id=user_id, limit=3)
            top_ids = {j["id"] for j in top_jobs}
            if top_ids and job_id not in top_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This opportunity is locked on the Free tier. Upgrade to TalentRadar Pro to download tailored ATS resumes for all results."
                )

        job = db.get_job(job_id, user_id=user_id)
        if not job:
            job = {
                "id": job_id,
                "title": "Software Engineer",
                "company": "",
            }

    prefs = db.get_user_preferences(user_id) if user_profile else {}
    from src.cv_exporter import generate_tailored_pdf
    pdf_bytes = generate_tailored_pdf(job, profile, prefs, template_id=template)
    company_clean = re.sub(r'[^a-zA-Z0-9_-]', '_', job.get('company') or 'Tailored').strip('_') or 'Tailored'
    filename = f"Tailored_CV_{company_clean}_{template}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.get("/api/cv/export-docx/{job_id}")
async def export_tailored_docx(
    job_id: str, 
    template: Optional[str] = "gulf_dubai_sapphire",
    user_profile: Optional[Dict[str, Any]] = Depends(get_optional_user_profile)
):
    """Exports an ATS-optimized Word DOCX resume tailored specifically for the target role and company in the selected template design."""
    user_id = (user_profile.get("id") if user_profile else None) or 1
    profile = user_profile or {"id": user_id, "username": "candidate", "full_name": "Candidate"}
    role = profile.get("role", "user") or "user"
    is_pro = role in ["admin", "pro"]

    if job_id == "custom_ats_scan":
        job = {
            "id": "custom_ats_scan",
            "title": "Senior Software Engineer",
            "company": "",
        }
    else:
        if user_profile and not is_pro:
            top_jobs = db.get_jobs(user_id=user_id, limit=3)
            top_ids = {j["id"] for j in top_jobs}
            if top_ids and job_id not in top_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This opportunity is locked on the Free tier. Upgrade to TalentRadar Pro to download tailored ATS resumes for all results."
                )

        job = db.get_job(job_id, user_id=user_id)
        if not job:
            job = {
                "id": job_id,
                "title": "Software Engineer",
                "company": "",
            }

    prefs = db.get_user_preferences(user_id) if user_profile else {}
    from src.cv_exporter import generate_tailored_docx
    docx_bytes = generate_tailored_docx(job, profile, prefs, template_id=template)
    company_clean = re.sub(r'[^a-zA-Z0-9_-]', '_', job.get('company') or 'Tailored').strip('_') or 'Tailored'
    filename = f"Tailored_CV_{company_clean}_{template}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


# ================= Subscription Management Endpoints =================

@app.post("/api/subscription/upgrade")
async def upgrade_subscription(
    payload: Optional[Dict[str, Any]] = None,
    user_profile: Dict[str, Any] = Depends(get_current_user_profile)
):
    """Upgrades current user to Pro tier, unlocking unlimited searches and all job opportunities.

    There is no payment integration yet, so self-service upgrades are only possible when
    ENABLE_TEST_ENDPOINTS is set (local/demo/testing). In production, admins grant Pro via
    POST /api/admin/users/{user_id}/role.
    """
    if not test_endpoints_enabled():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Online upgrades are not available yet. Please contact support to activate TalentRadar Pro."
        )
    user_id = user_profile.get("id") or 1
    db.update_user_role(user_id, "pro")
    updated = db.get_user_by_id(user_id)
    if updated:
        updated.pop("password_hash", None)
        quota = db.get_user_search_quota(user_id)
        updated.update({
            "searches_count": quota["searches_count"],
            "max_free_searches": quota["max_free_searches"],
            "searches_remaining": quota["searches_remaining"],
            "is_unlimited": True,
            "is_pro": True
        })
    return {
        "status": "success",
        "message": "🎉 Welcome to TalentRadar Pro! Unlimited searches and all opportunities are now unlocked.",
        "user": updated
    }


@app.post("/api/subscription/reset-quota")
async def reset_search_quota(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Resets the search counter back to 0 for testing or renewals (test mode only)."""
    if not test_endpoints_enabled():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quota resets are not available.")
    user_id = user_profile.get("id") or 1
    db.reset_user_searches(user_id)
    return {"status": "success", "message": "Search quota reset to 0/10."}


@app.post("/api/subscription/downgrade")
async def downgrade_subscription(user_profile: Dict[str, Any] = Depends(get_current_user_profile)):
    """Switches account back to Free tier for testing freemium gating."""
    user_id = user_profile.get("id") or 1
    db.update_user_role(user_id, "user")
    updated = db.get_user_by_id(user_id)
    if updated:
        updated.pop("password_hash", None)
        quota = db.get_user_search_quota(user_id)
        updated.update({
            "searches_count": quota["searches_count"],
            "max_free_searches": quota["max_free_searches"],
            "searches_remaining": quota["searches_remaining"],
            "is_unlimited": False,
            "is_pro": False
        })
    return {"status": "success", "message": "Switched to Free tier.", "user": updated}



class RoleUpdatePayload(BaseModel):
    role: str = Field(..., pattern=r"^(user|pro|admin)$")


@app.post("/api/admin/users/{user_id}/role")
async def admin_set_user_role(
    user_id: int,
    payload: RoleUpdatePayload,
    request: Request,
    admin_profile: Dict[str, Any] = Depends(require_admin)
):
    """Admin-only: set a user's plan/role (user, pro, admin)."""
    verify_request_origin(request)
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db.update_user_role(user_id, payload.role)
    auth.revoke_user_sessions(target["username"])  # force re-login so the new role applies cleanly
    return {"status": "success", "user_id": user_id, "role": payload.role}


@app.get("/landing", response_class=HTMLResponse)
async def serve_landing():
    """Serves the public marketing & sales landing website."""
    template_path = Path("templates/landing.html")
    if template_path.exists():
        return HTMLResponse(content=template_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h2>Landing page template missing</h2>")


@app.get("/app", response_class=HTMLResponse)
@app.get("/dashboard", response_class=HTMLResponse)
async def serve_app(request: Request):
    """Serves the core SaaS job radar application dashboard."""
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    if not username and auth.enabled:
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

    template_path = Path("templates/dashboard.html")
    if template_path.exists():
        html_content = template_path.read_text(encoding="utf-8")
    else:
        html_content = "<h2>Dashboard template missing</h2>"
    return HTMLResponse(content=html_content)


@app.post("/api/test/reset-rate-limit")
async def reset_test_rate_limit():
    """Resets in-memory authentication rate limit counters and resets test users for automated test suites.

    Only available when ENABLE_TEST_ENDPOINTS is set; returns 404 otherwise.
    """
    if not test_endpoints_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    auth.ip_attempts.clear()
    auth.account_attempts.clear()
    auth.registration_attempts.clear()
    try:
        free_user = db.get_user_by_username("freeuser")
        if free_user:
            db.update_user_role(free_user["id"], "user")
            db.reset_user_searches(free_user["id"])
    except Exception:
        pass
    return {"status": "success", "message": "Rate limits and test user states reset."}


@app.get("/", response_class=HTMLResponse)
async def serve_root(request: Request):
    """Smart router: Authenticated users go to Dashboard; public visitors see the Marketing Landing Page."""
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    
    # If user has an active session, open their application dashboard
    if username:
        template_path = Path("templates/dashboard.html")
        if template_path.exists():
            return HTMLResponse(content=template_path.read_text(encoding="utf-8"))

    # Public visitor -> Marketing & Pricing Landing Page
    template_path = Path("templates/landing.html")
    if template_path.exists():
        return HTMLResponse(content=template_path.read_text(encoding="utf-8"))

    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
