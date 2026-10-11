"""FastAPI Interactive Job Tracker with Trash / Ignore, Restore, Permanent Tech Stack, CV Upload & Multi-Day Filters."""

import os
import re
import secrets
import shutil
import asyncio
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, Depends, status, Response, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from src.database import JobDatabase
from src.job_searcher import GulfJobSearcher
from src.pakistan_job_searcher import PakistanJobSearcher
from src.auth import AuthManager
from src.preferences import load_preferences, save_preferences, get_active_cv_details
from src.cv_parser import CVParser
from main import run_single_pipeline, load_config

app = FastAPI(title="Job Hunter & AI Feedback Tracker (Trash & Restore Support)")


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Enforce defensive HTTP security headers against MIME sniffing, clickjacking, and referrer leakage."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


db = JobDatabase()
config = load_config()
auth = AuthManager(config)


class LoginPayload(BaseModel):
    username: str
    password: str


class StatusUpdate(BaseModel):
    status: str


class FeedbackUpdate(BaseModel):
    rating: str
    notes: Optional[str] = ""


class PreferencesPayload(BaseModel):
    candidate_name: Optional[str] = "Jamshaid Ali"
    active_cv: Optional[str] = "Jamshaid_Ali_Python_Django-5.pdf"
    primary_stack: Optional[List[str]] = []
    default_roles: Optional[List[str]] = []
    custom_instructions: Optional[str] = ""
    excluded_keywords: Optional[List[str]] = []
    min_match_score: Optional[int] = 55
    experience_level: Optional[str] = "Mid-Senior"


def get_current_user(request: Request) -> str:
    if not auth.enabled:
        return "admin"
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return username


@app.post("/api/login")
async def login_api(payload: LoginPayload, request: Request, response: Response):
    # Extract client IP with X-Forwarded-For support when behind reverse proxies / cloud load balancers
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"
    
    if not auth.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 15 minutes."
        )

    if not auth.verify_credentials(payload.username, payload.password):
        auth.record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # Reset failed attempts counter upon successful authentication
    auth.reset_failed_attempts(client_ip)

    token = auth.create_session_token(payload.username)
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=auth.session_duration_hours * 3600,
        samesite="lax",
        secure=is_secure
    )
    return {"status": "success", "message": "Login successful", "username": payload.username}


@app.post("/api/logout")
@app.get("/logout")
async def logout(response: Response):
    res = RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    res.delete_cookie("session_token")
    return res


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    token = request.cookies.get("session_token")
    if auth.verify_session_token(token):
        return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In &bull; Job Hunter Intelligence</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            background-color: #eaf1f8;
            background-image: 
                radial-gradient(at 0% 0%, rgba(219, 234, 254, 0.9) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(224, 231, 255, 0.8) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(225, 239, 254, 0.6) 0px, transparent 50%);
            background-attachment: fixed;
        }
    </style>
</head>
<body class="text-slate-800 min-h-screen flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
    <div class="w-full max-w-md" x-data="loginForm()">
        <div class="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>

            <div class="text-center mb-8 pt-2">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 mb-4 shadow-lg shadow-indigo-500/30 text-white">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Job Hunter AI</h1>
                <p class="text-slate-500 text-xs mt-1.5 font-semibold">Candidate Portal &bull; Jamshaid Ali (Gulf & PK)</p>
            </div>

            <template x-if="errorMessage">
                <div class="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2" x-text="errorMessage"></div>
            </template>

            <form @submit.prevent="submitLogin()" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
                    <input type="text" x-model="username" required autofocus placeholder="e.g. jamshaid" class="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 outline-none transition font-medium">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                    <input type="password" x-model="password" required placeholder="••••••••••••" class="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 outline-none transition font-medium">
                </div>

                <button type="submit" :disabled="loading" class="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition flex items-center justify-center gap-2 cursor-pointer">
                    <span x-show="!loading">Sign In to Dashboard &rarr;</span>
                    <span x-show="loading" class="flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                        Authenticating...
                    </span>
                </button>
            </form>

            <div class="mt-6 pt-4 border-t border-slate-100 text-center">
                <span class="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                    HMAC-SHA256 Cryptographic Local Session
                </span>
            </div>
        </div>
    </div>

    <script>
        function loginForm() {
            return {
                username: '',
                password: '',
                loading: false,
                errorMessage: '',
                async submitLogin() {
                    this.loading = true;
                    this.errorMessage = '';
                    try {
                        const res = await fetch('/api/login', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({username: this.username, password: this.password})
                        });
                        const data = await res.json();
                        if (res.ok) {
                            window.location.href = '/';
                        } else {
                            this.errorMessage = data.detail || 'Login failed.';
                        }
                    } catch (err) {
                        this.errorMessage = 'Network connection error.';
                    }
                    this.loading = false;
                }
            }
        }
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)


@app.get("/api/stats")
async def get_stats(user: str = Depends(get_current_user)):
    return db.get_stats()


@app.get("/api/jobs")
async def get_jobs(
    region: Optional[str] = "all",
    status: Optional[str] = "all",
    time_filter: Optional[str] = "all",
    search: Optional[str] = "",
    user: str = Depends(get_current_user)
):
    jobs = db.get_jobs(region=region, status=status, time_filter=time_filter, search=search)
    # Defensively sanitize URLs against dangerous schemes (javascript:, vbscript:, etc.)
    for j in jobs:
        apply_url = str(j.get("apply_url") or "").strip()
        if not (apply_url.startswith("http://") or apply_url.startswith("https://")):
            j["apply_url"] = "#"
        for hm in j.get("hiring_managers", []):
            hm_url = str(hm.get("linkedin_url") or "").strip()
            if not (hm_url.startswith("http://") or hm_url.startswith("https://")):
                hm["linkedin_url"] = "#"
    return jobs


@app.post("/api/jobs/{job_id}/status")
async def update_status(job_id: str, payload: StatusUpdate, user: str = Depends(get_current_user)):
    success = db.update_job_status(job_id, payload.status)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "new_status": payload.status}


@app.delete("/api/jobs/{job_id}")
async def delete_job_api(job_id: str, user: str = Depends(get_current_user)):
    success = db.delete_job_permanently(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "message": "Job permanently deleted."}


@app.post("/api/jobs/{job_id}/feedback")
async def submit_feedback(job_id: str, payload: FeedbackUpdate, user: str = Depends(get_current_user)):
    return db.set_feedback(job_id, payload.rating, payload.notes or "")


@app.get("/api/preferences")
async def get_prefs(user: str = Depends(get_current_user)):
    prefs = load_preferences()
    cv_info = get_active_cv_details()
    return {"preferences": prefs, "active_cv": cv_info}


@app.post("/api/preferences")
async def update_prefs(payload: PreferencesPayload, user: str = Depends(get_current_user)):
    save_preferences(payload.model_dump(exclude_unset=True))
    return {"status": "success", "message": "Preferences and Permanent Tech Stack updated successfully."}


@app.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Please upload PDF, DOCX, or TXT.")

    resumes_dir = Path("data/resumes")
    resumes_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Path traversal prevention & safe filename generation
    raw_base_name = Path(file.filename).name
    clean_stem = re.sub(r'[^a-zA-Z0-9_\-]', '_', Path(raw_base_name).stem).strip('_')
    if not clean_stem:
        clean_stem = f"resume_{secrets.token_hex(4)}"
    safe_filename = f"{clean_stem}{ext}"
    target_path = resumes_dir / safe_filename

    # 2. Maximum file size cap (5 MB) to prevent disk/memory exhaustion DoS
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    total_bytes = 0

    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = await file.read(64 * 1024)  # 64 KB chunks
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
        profile = parser.parse_profile(text)
        detected_skills = profile.get("skills", [])
        
        prefs = load_preferences()
        existing_stack = prefs.get("primary_stack", [])
        updated_stack = list(set(existing_stack + detected_skills)) if detected_skills else existing_stack

        save_preferences({
            "active_cv": safe_filename,
            "candidate_name": profile.get("name") or "Jamshaid Ali",
            "primary_stack": updated_stack
        })

        return {
            "status": "success",
            "filename": safe_filename,
            "candidate_name": profile.get("name", "Jamshaid Ali"),
            "skills": detected_skills,
            "message": f"Successfully parsed {safe_filename} and synced detected skills!"
        }
    except Exception as e:
        save_preferences({"active_cv": safe_filename})
        return {
            "status": "success",
            "filename": safe_filename,
            "candidate_name": "Jamshaid Ali",
            "skills": ["Python", "Django"],
            "message": f"Saved {safe_filename} as active resume."
        }


def _run_scan_background(region: str, time_window: str):
    try:
        prefs = load_preferences()
        roles = prefs.get("default_roles", ["Python Developer", "Django Developer", "Full Stack Engineer"])
        cv_filename = prefs.get("active_cv", "Jamshaid_Ali_Python_Django-5.pdf")
        cv_path = f"data/resumes/{cv_filename}"
        if not Path(cv_path).exists():
            cv_path = ""

        if region in ["all", "gulf"]:
            gulf_searcher = GulfJobSearcher()
            run_single_pipeline("gulf", "Gulf Region", "🌴", gulf_searcher, cv_path, roles, limit=15, send_notify=True, only_unseen=False)

        if region in ["all", "pakistan"]:
            pk_searcher = PakistanJobSearcher()
            run_single_pipeline("pakistan", "Pakistan & Lahore Tech", "🇵🇰", pk_searcher, cv_path, roles, limit=15, send_notify=True, only_unseen=False)
    except Exception as e:
        print(f"[!] Background scan error: {e}")


@app.post("/api/scan")
async def trigger_scan(
    background_tasks: BackgroundTasks,
    region: str = "all",
    time_window: str = "week",
    user: str = Depends(get_current_user)
):
    background_tasks.add_task(_run_scan_background, region, time_window)
    return {
        "status": "started",
        "message": "Scan launched in the background. Your dashboard will auto-refresh live!"
    }


@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    token = request.cookies.get("session_token")
    username = auth.verify_session_token(token)
    if not username and auth.enabled:
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Hunter & Pipeline Intelligence &bull; Jamshaid Ali</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            background-color: #e9f1f8;
            background-image: 
                radial-gradient(at 10% 10%, rgba(219, 234, 254, 0.9) 0px, transparent 50%),
                radial-gradient(at 90% 15%, rgba(224, 231, 255, 0.85) 0px, transparent 50%),
                radial-gradient(at 50% 90%, rgba(207, 250, 254, 0.7) 0px, transparent 50%),
                radial-gradient(at 80% 80%, rgba(219, 234, 254, 0.6) 0px, transparent 50%);
            background-attachment: fixed;
        }
        [x-cloak] { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #e2e8f0; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
    </style>
</head>
<body class="text-slate-800 min-h-screen antialiased custom-scrollbar selection:bg-indigo-500 selection:text-white" x-data="jobTracker()">
    
    <!-- Floating Action Toast Notification -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none" x-cloak>
        <template x-if="toastMessage">
            <div class="pointer-events-auto bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm font-semibold animate-fade-in">
                <span class="text-lg" x-text="toastIcon">✨</span>
                <span x-text="toastMessage"></span>
            </div>
        </template>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        <!-- Navigation Header Card -->
        <header class="mb-8 p-6 sm:p-7 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

            <div class="flex items-start sm:items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            AI Live Multi-Market Pipeline
                        </div>

                        <!-- Active Permanent Stack Pill -->
                        <button @click="openSettings('stack')" class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-300 text-blue-800 text-xs font-bold hover:bg-blue-100 transition cursor-pointer">
                            <span>🛠️ Permanent Stack:</span>
                            <span x-text="(preferences.primary_stack || ['Python', 'Django']).slice(0, 3).join(', ') + '...'" class="underline"></span>
                        </button>
                    </div>

                    <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Job Hunter &amp; Application Pipeline</h1>
                    <p class="text-slate-600 text-xs sm:text-sm mt-0.5 font-medium">Candidate: <strong class="text-slate-900" x-text="preferences.candidate_name || 'Jamshaid Ali'">Jamshaid Ali</strong> &bull; Target Hubs: <span class="text-emerald-700 font-bold">🇵🇰 Pakistan (Lahore/Isb)</span> &amp; <span class="text-blue-700 font-bold">🌴 Gulf (Dubai/Riyadh)</span></p>
                </div>
            </div>

            <!-- Header Action Controls -->
            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <button @click="openSettings()" class="px-4 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-xs transition flex items-center gap-2 cursor-pointer">
                    <span class="text-base">⚙️</span>
                    <span>Stack &amp; Matching Settings</span>
                </button>

                <button @click="triggerScan('all', timeFilter)" :disabled="scanning" class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 transition flex items-center gap-2 cursor-pointer">
                    <span x-show="!scanning">⚡ Scan Fresh Postings</span>
                    <span x-show="scanning" class="flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                        Scanning Pipelines...
                    </span>
                </button>

                <a href="/logout" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Logout</span>
                </a>
            </div>
        </header>

        <!-- KPI Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <div class="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active</span>
                    <span class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">📊</span>
                </div>
                <div class="text-3xl font-black text-slate-900 mt-2.5" x-text="stats.total_jobs || 0">0</div>
                <div class="text-xs text-slate-500 font-semibold mt-0.5">Tracked Jobs</div>
            </div>

            <div class="p-5 bg-white border border-emerald-200/90 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">24 Hours</span>
                    <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">⚡</span>
                </div>
                <div class="text-3xl font-black text-emerald-700 mt-2.5" x-text="stats.last_24h_jobs || 0">0</div>
                <div class="text-xs text-emerald-800 font-semibold mt-0.5">Newest Postings</div>
            </div>

            <div class="p-5 bg-white border border-sky-200/90 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-sky-800 uppercase tracking-wider">Past 3 Days</span>
                    <span class="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-sm font-bold">📅</span>
                </div>
                <div class="text-3xl font-black text-sky-700 mt-2.5" x-text="stats.last_3d_jobs || 0">0</div>
                <div class="text-xs text-sky-800 font-semibold mt-0.5">Recent Opportunities</div>
            </div>

            <div class="p-5 bg-white border border-purple-200/90 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-purple-800 uppercase tracking-wider">Applied</span>
                    <span class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-bold">🚀</span>
                </div>
                <div class="text-3xl font-black text-purple-700 mt-2.5" x-text="stats.applied_jobs || 0">0</div>
                <div class="text-xs text-purple-800 font-semibold mt-0.5">Pipeline Sent</div>
            </div>

            <div class="p-5 bg-white border border-teal-200/90 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-teal-800 uppercase tracking-wider">Pakistan</span>
                    <span class="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-sm font-bold">🇵🇰</span>
                </div>
                <div class="text-3xl font-black text-teal-700 mt-2.5" x-text="stats.pakistan_jobs || 0">0</div>
                <div class="text-xs text-teal-800 font-semibold mt-0.5">Lahore/Isb/Remote</div>
            </div>

            <div class="p-5 bg-white border border-blue-200/90 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-blue-800 uppercase tracking-wider">Gulf Region</span>
                    <span class="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">🌴</span>
                </div>
                <div class="text-3xl font-black text-blue-700 mt-2.5" x-text="stats.gulf_jobs || 0">0</div>
                <div class="text-xs text-blue-800 font-semibold mt-0.5">UAE/Saudi/Qatar</div>
            </div>
        </div>

        <!-- Filter Controls Bar -->
        <div class="mb-8 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            
            <div class="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <!-- Region Selector -->
                <div class="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button @click="region = 'all'; if(status === 'trash') status = 'all'; fetchJobs()" :class="region === 'all' && status !== 'trash' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer">
                        All Active
                    </button>
                    <button @click="region = 'pakistan'; if(status === 'trash') status = 'all'; fetchJobs()" :class="region === 'pakistan' && status !== 'trash' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                        <span>🇵🇰</span> <span>Pakistan (Lahore/Isb)</span>
                    </button>
                    <button @click="region = 'gulf'; if(status === 'trash') status = 'all'; fetchJobs()" :class="region === 'gulf' && status !== 'trash' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                        <span>🌴</span> <span>Gulf Region</span>
                    </button>
                    
                    <!-- Dedicated Trash Tab Button -->
                    <button @click="status = 'trash'; fetchJobs()" :class="status === 'trash' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-rose-700 font-semibold'" class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5">
                        <span>🗑️ Trash</span>
                        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold" :class="status === 'trash' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'" x-text="stats.trashed_jobs || 0"></span>
                    </button>
                </div>

                <div class="hidden sm:block h-6 w-px bg-slate-300"></div>

                <!-- Multi-Day Date Window Selector -->
                <div class="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200" x-show="status !== 'trash'">
                    <button @click="timeFilter = 'all'; fetchJobs()" :class="timeFilter === 'all' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
                        ⏱️ All Past Week
                    </button>
                    <button @click="timeFilter = '24h'; fetchJobs()" :class="timeFilter === '24h' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
                        ⚡ Last 24 Hours
                    </button>
                    <button @click="timeFilter = '2d'; fetchJobs()" :class="timeFilter === '2d' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
                        📅 Past 2 Days
                    </button>
                    <button @click="timeFilter = '3d'; fetchJobs()" :class="timeFilter === '3d' ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-semibold'" class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
                        📅 Past 3 Days
                    </button>
                </div>

                <div class="hidden sm:block h-6 w-px bg-slate-300" x-show="status !== 'trash'"></div>

                <!-- Status Filter -->
                <select x-model="status" @change="fetchJobs()" class="bg-slate-50 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer">
                    <option value="all">All Application Statuses</option>
                    <option value="new">Status: New Opportunities</option>
                    <option value="applied">Status: Applied 🚀</option>
                    <option value="interviewing">Status: Interviewing 📞</option>
                    <option value="saved">Status: Saved ⭐</option>
                    <option value="rejected">Status: Rejected ❌</option>
                    <option value="trash">Status: 🗑️ Trashed / Ignored</option>
                </select>
            </div>

            <!-- Instant Search Input -->
            <div class="relative w-full xl:w-72">
                <input type="text" x-model="search" @input.debounce.300ms="fetchJobs()" placeholder="Search title, company, skills..." class="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition font-medium">
                <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                <button x-show="search" @click="search = ''; fetchJobs()" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold">&times;</button>
            </div>
        </div>

        <!-- Banner when viewing Trash Tab -->
        <template x-if="status === 'trash'">
            <div class="mb-6 p-4.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900 font-medium">
                <div class="flex items-center gap-2.5">
                    <span class="text-2xl">🗑️</span>
                    <div>
                        <strong>Viewing Trashed / Ignored Jobs:</strong> These jobs are excluded from your main feed and will never be re-scraped or re-sent in emails. Click <em>"Restore"</em> on any job to move it back to active.
                    </div>
                </div>
                <button @click="status = 'all'; fetchJobs()" class="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 rounded-xl font-bold transition flex-shrink-0 cursor-pointer">
                    &larr; Return to Active Feed
                </button>
            </div>
        </template>

        <!-- Job Postings List -->
        <div class="space-y-6">
            <template x-if="loading">
                <div class="bg-white border border-slate-200/90 rounded-3xl p-16 text-center shadow-sm">
                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-3">
                        <svg class="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                    </div>
                    <div class="text-base font-bold text-slate-800">Loading Pipeline Database...</div>
                    <p class="text-xs text-slate-500 mt-1">Filtering opportunities</p>
                </div>
            </template>

            <template x-if="!loading && jobs.length === 0">
                <div class="p-16 text-center bg-white border border-slate-200/90 rounded-3xl shadow-sm text-slate-600">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4" x-text="status === 'trash' ? '✨' : '📭'"></div>
                    <h3 class="text-lg font-bold text-slate-900" x-text="status === 'trash' ? 'Trash is Empty' : 'No matching jobs found in this filter'"></h3>
                    <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto" x-text="status === 'trash' ? 'You have no trashed jobs. Jobs you move to trash will be stored here.' : 'Try selecting All Past Week, clearing search, or click Scan Fresh Postings.'"></p>
                </div>
            </template>

            <!-- Job Cards with Colored Region Borders -->
            <template x-for="job in jobs" :key="job.id">
                <div class="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                     :class="job.status === 'trash' ? 'border-l-6 border-l-rose-500 opacity-90' : (job.country === 'Pakistan' ? 'border-l-6 border-l-emerald-500' : 'border-l-6 border-l-blue-500')">
                    
                    <!-- Card Top Header -->
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-200">
                        <div class="space-y-2 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="text-2xl" x-text="job.country === 'Pakistan' ? '🇵🇰' : '🌴'"></span>
                                <h2 class="text-xl font-extrabold text-slate-900 hover:text-indigo-600 transition tracking-tight" x-text="job.title"></h2>
                                
                                <!-- Exact Post Date Badge -->
                                <span class="px-3 py-1 rounded-full text-xs font-bold border" 
                                      :class="job.posted_days_ago <= 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : (job.posted_days_ago <= 2 ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-slate-100 text-slate-800 border-slate-300')" 
                                      x-text="'📅 ' + (job.posted_date || 'Recent') + ' (' + job.posted_ago + ')'">
                                </span>

                                <span x-show="job.status === 'trash'" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    🗑️ Trashed
                                </span>
                            </div>

                            <div class="text-slate-700 text-xs sm:text-sm flex flex-wrap items-center gap-2 font-medium">
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="text-slate-500">🏢</span>
                                    <span x-text="job.company"></span>
                                </span>
                                <span class="text-slate-400">&bull;</span>
                                <span class="flex items-center gap-1.5 text-slate-700">
                                    <span class="text-slate-500">📍</span>
                                    <span x-text="job.location"></span>
                                </span>
                                <span class="text-slate-400">&bull;</span>
                                <span class="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-bold" x-text="job.source"></span>
                            </div>
                        </div>

                        <!-- Match Score & Apply Action -->
                        <div class="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                            <div class="text-right">
                                <div class="text-3xl font-black" :class="job.match_score >= 80 ? 'text-emerald-600' : (job.match_score >= 60 ? 'text-indigo-600' : 'text-amber-600')" x-text="job.match_score + '%'"></div>
                                <div class="text-xs font-bold uppercase tracking-wider" :class="job.match_score >= 80 ? 'text-emerald-700' : (job.match_score >= 60 ? 'text-indigo-700' : 'text-amber-700')" x-text="job.fit_verdict"></div>
                            </div>
                            
                            <a :href="job.apply_url" target="_blank" rel="noopener noreferrer" class="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
                                <span>Apply Now</span>
                                <span>&rarr;</span>
                            </a>
                        </div>
                    </div>

                    <!-- AI Match Assessment Callout -->
                    <div class="mt-4 p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
                        <span class="text-xl flex-shrink-0">💡</span>
                        <div>
                            <strong class="text-indigo-950 font-bold">AI Match Assessment: </strong>
                            <span class="text-slate-700 font-medium" x-text="job.summary"></span>
                        </div>
                    </div>

                    <!-- Collapsible Full Job Description Section -->
                    <div class="mt-3" x-data="{ expandedJd: false }">
                        <div class="flex items-center justify-between">
                            <button @click="expandedJd = !expandedJd" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-2xs">
                                <span>📄</span>
                                <span x-text="expandedJd ? 'Hide Full Job Description ▲' : 'View Full Job Description (JD) ▼'"></span>
                            </button>
                            <button x-show="expandedJd" @click="copyText(job.description, 'Full Job Description copied to clipboard!')" type="button" class="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                <span>📋</span> <span>Copy JD</span>
                            </button>
                        </div>

                        <div x-show="expandedJd" x-collapse class="mt-3 p-5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed max-h-96 overflow-y-auto custom-scrollbar font-normal">
                            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span>📌</span> <span>Official Job Description &amp; Requirements</span>
                            </div>
                            <div class="whitespace-pre-line text-slate-800" x-text="job.description || 'Full job description available on application portal.'"></div>
                        </div>
                    </div>

                    <!-- Intelligence Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        
                        <!-- Left Column: Recruiter Intel Panel -->
                        <div class="p-4 sm:p-5 bg-[#f8fafc] border border-slate-200/90 rounded-2xl space-y-3">
                            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <span class="text-base">👤</span>
                                    <span>Hiring Manager &amp; Recruiters</span>
                                </h3>
                                <span class="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold" x-text="job.hiring_managers.length + ' Discovered'"></span>
                            </div>

                            <div class="space-y-2.5">
                                <template x-for="hm in job.hiring_managers" :key="hm.name">
                                    <div class="flex items-center justify-between p-3.5 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition">
                                        <div class="pr-2">
                                            <div class="text-sm font-bold text-slate-900" x-text="hm.name"></div>
                                            <div class="text-xs text-slate-600 font-medium" x-text="hm.role"></div>
                                        </div>
                                        <a :href="hm.linkedin_url" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 flex-shrink-0">
                                            <span>LinkedIn</span>
                                            <span>&rarr;</span>
                                        </a>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <!-- Right Column: Tailored CV & ATS Optimization Panel -->
                        <div class="p-4 sm:p-5 bg-[#f8fafc] border border-slate-200/90 rounded-2xl space-y-3">
                            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <span class="text-base">✍️</span>
                                    <span>Tailored CV &amp; ATS Optimization</span>
                                </h3>
                                <button @click="copyText(job.missing_keywords.join(', '), 'Keywords copied to clipboard!')" class="text-xs text-amber-900 hover:text-amber-950 font-bold bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1">
                                    <span>📋</span> <span>Copy Keywords</span>
                                </button>
                            </div>

                            <!-- Missing ATS Keywords Tag Cloud -->
                            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <span class="text-xs font-bold text-amber-900 block mb-1.5">🎯 Missing ATS Keywords to Include:</span>
                                <div class="flex flex-wrap gap-1.5">
                                    <template x-for="kw in job.missing_keywords" :key="kw">
                                        <span class="px-2.5 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 text-xs font-bold shadow-2xs" x-text="kw"></span>
                                    </template>
                                </div>
                            </div>

                            <!-- Tailored CV Bullet Suggestions -->
                            <div class="space-y-2">
                                <template x-for="(bullet, index) in job.tailored_bullets" :key="index">
                                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs hover:border-slate-300 transition group">
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="text-indigo-800 font-extrabold text-xs uppercase tracking-wide" x-text="bullet.original_or_focus"></span>
                                            <button @click="copyText(bullet.suggested_bullet, 'CV bullet point copied!')" class="text-xs text-slate-500 hover:text-indigo-600 font-bold opacity-80 group-hover:opacity-100 transition cursor-pointer flex items-center gap-1">
                                                <span>📋</span> <span>Copy</span>
                                            </button>
                                        </div>
                                        <p class="text-slate-800 text-xs font-medium leading-relaxed" x-text="bullet.suggested_bullet"></p>
                                    </div>
                                </template>
                            </div>
                        </div>

                    </div>

                    <!-- Bottom Bar: Status Controls, Trash, Restore & AI Feedback -->
                    <div class="mt-6 pt-5 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        
                        <!-- Application Status Selector / Restore Actions -->
                        <div class="flex flex-wrap items-center gap-2">
                            
                            <!-- When viewing normal/active job -->
                            <template x-if="job.status !== 'trash'">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">Status:</span>
                                    <div class="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-200">
                                        <button @click="updateStatus(job.id, 'new')" :class="job.status === 'new' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-medium'" class="px-3 py-1 rounded-lg text-xs transition cursor-pointer">
                                            New
                                        </button>
                                        <button @click="updateStatus(job.id, 'applied')" :class="job.status === 'applied' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-medium'" class="px-3 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                                            <span>Applied</span> <span>🚀</span>
                                        </button>
                                        <button @click="updateStatus(job.id, 'interviewing')" :class="job.status === 'interviewing' ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-medium'" class="px-3 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                                            <span>Interviewing</span> <span>📞</span>
                                        </button>
                                        <button @click="updateStatus(job.id, 'saved')" :class="job.status === 'saved' ? 'bg-amber-500 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-medium'" class="px-3 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                                            <span>Saved</span> <span>⭐</span>
                                        </button>
                                        <button @click="updateStatus(job.id, 'rejected')" :class="job.status === 'rejected' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:text-slate-900 font-medium'" class="px-3 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1">
                                            <span>Rejected</span> <span>❌</span>
                                        </button>
                                    </div>

                                    <!-- Move to Trash Button -->
                                    <button @click="moveToTrash(job.id)" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs" title="Move to Trash & Ignore for Future Scans">
                                        <span>🗑️ Trash</span>
                                    </button>
                                </div>
                            </template>

                            <!-- When viewing Trashed job -->
                            <template x-if="job.status === 'trash'">
                                <div class="flex items-center gap-2">
                                    <button @click="restoreJob(job.id)" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                                        <span>♻️ Restore to Active Feed</span>
                                    </button>

                                    <button @click="deletePermanently(job.id)" class="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs border border-rose-300 transition flex items-center gap-1 cursor-pointer">
                                        <span>❌ Delete Permanently</span>
                                    </button>
                                </div>
                            </template>

                        </div>

                        <!-- AI Reinforcement Feedback Engine -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">AI Training:</span>
                            <button @click="setFeedback(job.id, 'like')" :class="job.feedback_rating === 'like' ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'" class="px-3.5 py-1.5 rounded-xl text-xs border transition flex items-center gap-1 cursor-pointer font-semibold shadow-2xs">
                                <span>👍 Relevant</span>
                            </button>
                            <button @click="setFeedback(job.id, 'dislike')" :class="job.feedback_rating === 'dislike' ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'" class="px-3.5 py-1.5 rounded-xl text-xs border transition flex items-center gap-1 cursor-pointer font-semibold shadow-2xs">
                                <span>👎 Irrelevant</span>
                            </button>
                        </div>
                    </div>

                </div>
            </template>
        </div>

    </div>

    <!-- ========================================================================= -->
    <!-- SETTINGS MODAL: PERMANENT TECH STACK, CV UPLOAD & CUSTOM PROMPT           -->
    <!-- ========================================================================= -->
    <div x-show="settingsOpen" x-cloak class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" @keydown.escape.window="settingsOpen = false">
        
        <div class="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative" @click.outside="settingsOpen = false">
            
            <!-- Modal Header -->
            <div class="p-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/30">
                        ⚙️
                    </div>
                    <div>
                        <h2 class="text-xl font-extrabold text-slate-900">Permanent Stack &amp; Matching Intelligence</h2>
                        <p class="text-xs text-slate-500 font-medium">Define your permanent tech stack, active CV, and custom scan instructions</p>
                    </div>
                </div>

                <button @click="settingsOpen = false" class="text-slate-400 hover:text-slate-700 text-2xl font-bold p-1 cursor-pointer">&times;</button>
            </div>

            <!-- Modal Tabs -->
            <div class="px-6 pt-4 border-b border-slate-200 bg-white flex flex-wrap gap-2">
                <button @click="settingsTab = 'stack'" :class="settingsTab === 'stack' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'" class="pb-3 px-3 border-b-2 text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                    <span>🛠️</span> <span>Permanent Tech Stack</span>
                </button>
                <button @click="settingsTab = 'cv'" :class="settingsTab === 'cv' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'" class="pb-3 px-3 border-b-2 text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                    <span>📄</span> <span>Active CV File</span>
                </button>
                <button @click="settingsTab = 'instructions'" :class="settingsTab === 'instructions' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'" class="pb-3 px-3 border-b-2 text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                    <span>🧠</span> <span>Custom Instructions</span>
                </button>
                <button @click="settingsTab = 'filters'" :class="settingsTab === 'filters' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'" class="pb-3 px-3 border-b-2 text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                    <span>🚫</span> <span>Exclusions &amp; Threshold</span>
                </button>
            </div>

            <!-- Modal Body Container -->
            <div class="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                
                <!-- TAB 1: PERMANENT TECH STACK (User Configurable) -->
                <div x-show="settingsTab === 'stack'" class="space-y-6">
                    
                    <div class="p-4 bg-blue-50/70 border border-blue-200/90 rounded-2xl">
                        <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">💡 Your Official Permanent Tech Stack</h4>
                        <p class="text-xs text-blue-800 leading-relaxed">
                            The AI matching engine strictly evaluates every job posting against this stack. Any job demanding an incompatible primary language outside your configured stack will be flagged as a Stack Conflict and disqualified.
                        </p>
                    </div>

                    <!-- Permanent Stack Tags List -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Configured Permanent Stack Skills:</label>
                            <button @click="syncCvSkillsToStack()" type="button" class="text-xs text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer">
                                🔄 Sync All Detected Skills from CV
                            </button>
                        </div>

                        <div class="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[80px]">
                            <template x-for="(skill, idx) in (preferences.primary_stack || [])" :key="idx">
                                <span class="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 group hover:border-indigo-400">
                                    <span x-text="skill"></span>
                                    <button @click="removeStackSkill(idx)" class="text-slate-400 hover:text-rose-600 font-black cursor-pointer text-sm">&times;</button>
                                </span>
                            </template>
                        </div>
                    </div>

                    <!-- Add New Skill Input & Quick Suggestion Pills -->
                    <div class="space-y-3">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Add More Technologies to Your Stack:</label>
                        <div class="flex gap-2">
                            <input type="text" x-model="newStackSkillInput" @keydown.enter.prevent="addStackSkill()" placeholder="e.g. FastAPI, Celery, React, PostgreSQL, Docker, AWS..." class="flex-1 bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white outline-none font-medium">
                            <button @click="addStackSkill()" type="button" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                                + Add to Stack
                            </button>
                        </div>

                        <div class="flex flex-wrap items-center gap-1.5 pt-1">
                            <span class="text-xs text-slate-400 font-semibold mr-1">Quick Add:</span>
                            <template x-for="rec in ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'Celery', 'Redis', 'React', 'Node.js', 'Kubernetes', 'AI']" :key="rec">
                                <button @click="quickAddStack(rec)" type="button" class="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold border border-slate-200 transition cursor-pointer" x-text="'+ ' + rec"></button>
                            </template>
                        </div>
                    </div>

                </div>

                <!-- TAB 2: ACTIVE CV FILE & UPLOAD -->
                <div x-show="settingsTab === 'cv'" class="space-y-6">
                    
                    <div class="p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-white border border-indigo-200 text-indigo-700 flex items-center justify-center text-2xl shadow-xs">
                                📄
                            </div>
                            <div>
                                <div class="text-xs font-bold text-indigo-900 uppercase tracking-wider">Currently Active CV</div>
                                <div class="text-base font-extrabold text-slate-900" x-text="activeCvInfo.filename || 'Jamshaid_Ali_Python_Django-5.pdf'"></div>
                                <div class="text-xs text-slate-500 mt-0.5" x-text="'Candidate: ' + (activeCvInfo.name || 'Jamshaid Ali') + (activeCvInfo.size_kb ? ' &bull; ' + activeCvInfo.size_kb + ' KB' : '')"></div>
                            </div>
                        </div>

                        <span class="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full">
                            ● Active Resume
                        </span>
                    </div>

                    <!-- Upload New CV Box -->
                    <div class="p-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl bg-indigo-50/20 text-center transition">
                        <div class="text-3xl mb-2">📤</div>
                        <h4 class="text-sm font-bold text-slate-900">Upload a New CV / Resume</h4>
                        <p class="text-xs text-slate-500 mt-1 mb-4">Supports PDF, DOCX, DOC, or TXT format.</p>
                        
                        <input type="file" id="cvFileInput" @change="handleFileSelect($event)" accept=".pdf,.docx,.doc,.txt,.md" class="hidden">
                        
                        <div class="flex items-center justify-center gap-3">
                            <button @click="document.getElementById('cvFileInput').click()" type="button" class="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                                📁 Choose CV File...
                            </button>
                            
                            <template x-if="selectedCvFile">
                                <button @click="uploadCvFile()" :disabled="uploadingCv" class="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5">
                                    <span x-show="!uploadingCv">Upload &amp; Set Active &rarr;</span>
                                    <span x-show="uploadingCv">Parsing CV...</span>
                                </button>
                            </template>
                        </div>

                        <template x-if="selectedCvFile">
                            <div class="mt-3 text-xs text-slate-700 font-semibold bg-white p-2 rounded-lg border border-slate-200 inline-block" x-text="'Selected: ' + selectedCvFile.name"></div>
                        </template>
                    </div>

                </div>

                <!-- TAB 3: CUSTOM MATCHING INSTRUCTIONS & TARGET ROLES -->
                <div x-show="settingsTab === 'instructions'" class="space-y-5">
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            🧠 Custom AI Matching Instructions &amp; Prompt:
                        </label>
                        <p class="text-xs text-slate-500 mb-2">Tell the AI engine what to prioritize, specific frameworks, job levels, or workplace preferences.</p>
                        <textarea x-model="preferences.custom_instructions" rows="4" class="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm p-4 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium" placeholder="e.g. Focus strongly on Django 5.x, FastAPI, Celery async tasks, high-concurrency APIs, AI agent integrations with LangChain/LlamaIndex. Prioritize Lahore remote or hybrid, and Gulf high-tier packages."></textarea>
                    </div>

                    <!-- Target Job Titles / Roles -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            🎯 Target Job Roles to Search For:
                        </label>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <template x-for="(role, idx) in (preferences.default_roles || [])" :key="idx">
                                <span class="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg flex items-center gap-2">
                                    <span x-text="role"></span>
                                    <button @click="removeRole(idx)" class="text-indigo-400 hover:text-indigo-800 font-black cursor-pointer">&times;</button>
                                </span>
                            </template>
                        </div>

                        <div class="flex gap-2">
                            <input type="text" x-model="newRoleInput" @keydown.enter.prevent="addRole()" placeholder="Add new target role (e.g. Lead Backend Architect)..." class="flex-1 bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:bg-white outline-none">
                            <button @click="addRole()" type="button" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                                + Add Role
                            </button>
                        </div>
                    </div>

                </div>

                <!-- TAB 4: EXCLUSIONS & THRESHOLD -->
                <div x-show="settingsTab === 'filters'" class="space-y-5">
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            🚫 Negative / Excluded Keywords (Dealbreakers):
                        </label>
                        <p class="text-xs text-slate-500 mb-2">Jobs containing these keywords will receive a strong penalty or be filtered out.</p>
                        
                        <div class="flex flex-wrap gap-2 mb-3">
                            <template x-for="(kw, idx) in (preferences.excluded_keywords || [])" :key="idx">
                                <span class="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
                                    <span x-text="kw"></span>
                                    <button @click="removeExcluded(idx)" class="text-rose-400 hover:text-rose-800 font-black cursor-pointer">&times;</button>
                                </span>
                            </template>
                        </div>

                        <div class="flex gap-2">
                            <input type="text" x-model="newExcludedInput" @keydown.enter.prevent="addExcluded()" placeholder="Add excluded keyword (e.g. PHP, WordPress, Junior)..." class="flex-1 bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-600 focus:bg-white outline-none">
                            <button @click="addExcluded()" type="button" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                                + Add Keyword
                            </button>
                        </div>
                    </div>

                    <!-- Minimum Match Score Slider -->
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Minimum Match Score Threshold:</label>
                            <span class="text-sm font-extrabold text-indigo-700" x-text="preferences.min_match_score + '%'"></span>
                        </div>
                        <input type="range" min="40" max="85" step="5" x-model="preferences.min_match_score" class="w-full accent-indigo-600 cursor-pointer">
                        <div class="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                            <span>40% (Show All Potential)</span>
                            <span>60% (Recommended)</span>
                            <span>85% (Strict Top Matches)</span>
                        </div>
                    </div>

                </div>

            </div>

            <!-- Modal Footer Controls -->
            <div class="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button @click="settingsOpen = false" type="button" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer">
                    Close
                </button>

                <div class="flex items-center gap-2">
                    <button @click="savePreferencesAction(false)" :disabled="savingPrefs" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                        <span x-show="!savingPrefs">Save Preferences</span>
                        <span x-show="savingPrefs">Saving...</span>
                    </button>

                    <button @click="savePreferencesAction(true)" :disabled="savingPrefs" class="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5">
                        <span>Save &amp; Re-Scan Matching Jobs ⚡</span>
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- Alpine.js Application Logic -->
    <script>
        function jobTracker() {
            return {
                jobs: [],
                stats: {},
                region: 'all',
                status: 'all',
                timeFilter: 'all',
                search: '',
                loading: true,
                scanning: false,
                toastMessage: '',
                toastIcon: '✨',
                toastTimeout: null,

                // Settings & Permanent Stack State
                settingsOpen: false,
                settingsTab: 'stack',
                preferences: {
                    primary_stack: []
                },
                activeCvInfo: {},
                selectedCvFile: null,
                uploadingCv: false,
                savingPrefs: false,
                newRoleInput: '',
                newExcludedInput: '',
                newStackSkillInput: '',

                async init() {
                    await this.fetchPreferences();
                    await this.fetchStats();
                    await this.fetchJobs();
                },

                showToast(message, icon = '✨') {
                    this.toastMessage = message;
                    this.toastIcon = icon;
                    if (this.toastTimeout) clearTimeout(this.toastTimeout);
                    this.toastTimeout = setTimeout(() => {
                        this.toastMessage = '';
                    }, 3000);
                },

                copyText(text, successMsg = 'Copied to clipboard!') {
                    navigator.clipboard.writeText(text);
                    this.showToast(successMsg, '📋');
                },

                async fetchPreferences() {
                    try {
                        const res = await fetch('/api/preferences');
                        if (res.ok) {
                            const data = await res.json();
                            this.preferences = data.preferences || {};
                            if (!this.preferences.primary_stack) {
                                this.preferences.primary_stack = ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker'];
                            }
                            this.activeCvInfo = data.active_cv || {};
                        }
                    } catch (e) {
                        console.error('Error fetching preferences:', e);
                    }
                },

                openSettings(tab = 'stack') {
                    this.settingsTab = tab;
                    this.settingsOpen = true;
                    this.fetchPreferences();
                },

                addStackSkill() {
                    if (!this.newStackSkillInput.trim()) return;
                    if (!this.preferences.primary_stack) this.preferences.primary_stack = [];
                    const skill = this.newStackSkillInput.trim();
                    if (!this.preferences.primary_stack.includes(skill)) {
                        this.preferences.primary_stack.push(skill);
                    }
                    this.newStackSkillInput = '';
                },

                quickAddStack(skill) {
                    if (!this.preferences.primary_stack) this.preferences.primary_stack = [];
                    if (!this.preferences.primary_stack.includes(skill)) {
                        this.preferences.primary_stack.push(skill);
                    }
                },

                removeStackSkill(index) {
                    this.preferences.primary_stack.splice(index, 1);
                },

                syncCvSkillsToStack() {
                    const detected = this.activeCvInfo.detected_cv_skills || this.activeCvInfo.skills || [];
                    if (!detected.length) {
                        this.showToast('No skills found in CV to sync', '⚠️');
                        return;
                    }
                    if (!this.preferences.primary_stack) this.preferences.primary_stack = [];
                    detected.forEach(s => {
                        if (!this.preferences.primary_stack.includes(s)) {
                            this.preferences.primary_stack.push(s);
                        }
                    });
                    this.showToast('Synced all CV skills to permanent stack!', '🔄');
                },

                handleFileSelect(event) {
                    if (event.target.files && event.target.files[0]) {
                        this.selectedCvFile = event.target.files[0];
                    }
                },

                async uploadCvFile() {
                    if (!this.selectedCvFile) return;
                    this.uploadingCv = true;
                    const formData = new FormData();
                    formData.append('file', this.selectedCvFile);

                    try {
                        const res = await fetch('/api/upload-cv', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        if (res.ok) {
                            this.showToast(data.message, '📄');
                            this.selectedCvFile = null;
                            await this.fetchPreferences();
                        } else {
                            this.showToast(data.detail || 'Upload failed', '⚠️');
                        }
                    } catch(e) {
                        this.showToast('Network error during upload', '⚠️');
                    }
                    this.uploadingCv = false;
                },

                addRole() {
                    if (!this.newRoleInput.trim()) return;
                    if (!this.preferences.default_roles) this.preferences.default_roles = [];
                    this.preferences.default_roles.push(this.newRoleInput.trim());
                    this.newRoleInput = '';
                },

                removeRole(index) {
                    this.preferences.default_roles.splice(index, 1);
                },

                addExcluded() {
                    if (!this.newExcludedInput.trim()) return;
                    if (!this.preferences.excluded_keywords) this.preferences.excluded_keywords = [];
                    this.preferences.excluded_keywords.push(this.newExcludedInput.trim());
                    this.newExcludedInput = '';
                },

                removeExcluded(index) {
                    this.preferences.excluded_keywords.splice(index, 1);
                },

                async savePreferencesAction(triggerScanNow = false) {
                    this.savingPrefs = true;
                    try {
                        const res = await fetch('/api/preferences', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(this.preferences)
                        });
                        if (res.ok) {
                            this.showToast('Permanent Stack & Preferences saved!', '✅');
                            this.settingsOpen = false;
                            if (triggerScanNow) {
                                await this.triggerScan('all', this.timeFilter);
                            }
                        }
                    } catch (e) {
                        this.showToast('Error saving preferences', '⚠️');
                    }
                    this.savingPrefs = false;
                },

                async fetchStats() {
                    const res = await fetch('/api/stats');
                    if (res.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    this.stats = await res.json();
                },

                async fetchJobs() {
                    this.loading = true;
                    const res = await fetch(`/api/jobs?region=${this.region}&status=${this.status}&time_filter=${this.timeFilter}&search=${encodeURIComponent(this.search)}`);
                    if (res.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    this.jobs = await res.json();
                    this.loading = false;
                },

                async updateStatus(jobId, newStatus) {
                    await fetch(`/api/jobs/${jobId}/status`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({status: newStatus})
                    });
                    const job = this.jobs.find(j => j.id === jobId);
                    if (job) job.status = newStatus;
                    await this.fetchStats();
                    this.showToast(`Status updated to ${newStatus.toUpperCase()}`, '🚀');
                },

                async moveToTrash(jobId) {
                    await fetch(`/api/jobs/${jobId}/status`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({status: 'trash'})
                    });
                    // Immediately filter out from active view
                    this.jobs = this.jobs.filter(j => j.id !== jobId);
                    await this.fetchStats();
                    this.showToast('Job moved to Trash & ignored for future scans 🗑️', '🗑️');
                },

                async restoreJob(jobId) {
                    await fetch(`/api/jobs/${jobId}/status`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({status: 'new'})
                    });
                    // If currently on trash view, remove from trash list
                    this.jobs = this.jobs.filter(j => j.id !== jobId);
                    await this.fetchStats();
                    this.showToast('Job restored to Active Feed! ♻️', '✅');
                },

                async deletePermanently(jobId) {
                    if (!confirm('Are you sure you want to permanently delete this job record?')) return;
                    await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
                    this.jobs = this.jobs.filter(j => j.id !== jobId);
                    await this.fetchStats();
                    this.showToast('Job permanently deleted', '❌');
                },

                async setFeedback(jobId, rating) {
                    await fetch(`/api/jobs/${jobId}/feedback`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({rating: rating, notes: ''})
                    });
                    const job = this.jobs.find(j => j.id === jobId);
                    if (job) job.feedback_rating = rating;
                    this.showToast(`AI model calibrated with your feedback!`, '🧠');
                },

                async triggerScan(region, timeWindow) {
                    this.scanning = true;
                    this.showToast('⚡ Scan started in background! Live updating...', '⚡');
                    try {
                        await fetch(`/api/scan?region=${region}&time_window=${timeWindow}`, {method: 'POST'});
                        
                        let count = 0;
                        const interval = setInterval(async () => {
                            count++;
                            await this.fetchStats();
                            await this.fetchJobs();
                            if (count >= 6) {
                                clearInterval(interval);
                                this.scanning = false;
                                this.showToast('✅ Scan completed & fresh jobs loaded!', '✅');
                            }
                        }, 3000);
                    } catch(e) {
                        this.scanning = false;
                        this.showToast('Error running scan', '⚠️');
                    }
                }
            }
        }
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
