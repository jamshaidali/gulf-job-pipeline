"""Alert Service: Dispatches automated email digests and real-time alerts for high-match opportunities."""

import os
import html
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

from src.database import JobDatabase

load_dotenv()


def safe_url(url: Any, default: str = "#") -> str:
    """Validates URL scheme to prevent javascript: and data: URI injection attacks."""
    url_str = str(url or "").strip()
    if url_str.startswith("http://") or url_str.startswith("https://"):
        return html.escape(url_str)
    return default


def build_alert_email_html(
    jobs: List[Dict[str, Any]], 
    candidate_name: str = "Candidate", 
    min_match_score: int = 70,
    is_test: bool = False
) -> str:
    """Generates an executive, mobile-responsive HTML email digest with inline styles."""
    today_str = datetime.now().strftime("%B %d, %Y")
    safe_name = html.escape(candidate_name)
    app_url = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

    job_cards_html = ""
    for idx, job in enumerate(jobs, 1):
        title = html.escape(str(job.get("title", "Software Engineer")))
        company = html.escape(str(job.get("company", "Tech Company")))
        location = html.escape(str(job.get("location", "Remote")))
        country = str(job.get("country", "")).strip()
        posted = html.escape(str(job.get("posted_ago", "Recent")))
        source = html.escape(str(job.get("source", "Web")))
        apply_url = safe_url(job.get("apply_url"))
        job_id = job.get("id", "")
        
        score = int(job.get("match_score", 75))
        verdict = html.escape(str(job.get("fit_verdict", "Top Fit")))
        summary = html.escape(str(job.get("summary", "")))
        headline = html.escape(str(job.get("tailored_headline", "")))
        missing_kws = job.get("missing_keywords", [])
        hiring_managers = job.get("hiring_managers", [])

        # Country tag & flag
        if country.lower() == "pakistan":
            flag_pill = '🇵🇰 Pakistan & Remote'
            flag_bg = '#ecfdf5'
            flag_color = '#065f46'
        else:
            flag_pill = '🌴 Gulf Tech Hub'
            flag_bg = '#f0fdfa'
            flag_color = '#0f766e'

        # Recruiter section
        hm_html = ""
        if hiring_managers:
            hm_rows = ""
            for hm in hiring_managers[:2]:
                hm_name = html.escape(str(hm.get("name", "Hiring Lead")))
                hm_role = html.escape(str(hm.get("role", "Technical Recruiter")))
                hm_url = safe_url(hm.get("linkedin_url"))
                hm_rows += f"""
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-top: 6px;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a;">{hm_name} &bull; <span style="font-weight: 500; color: #64748b;">{hm_role}</span></div>
                    <div style="margin-top: 4px;">
                        <a href="{hm_url}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: none; font-size: 12px; font-weight: 700;">🔗 View LinkedIn Profile &rarr;</a>
                    </div>
                </div>
                """
            hm_html = f"""
            <div style="margin-top: 14px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">👔 Identified Decision-Makers & Recruiters</div>
                {hm_rows}
            </div>
            """

        # Missing keywords
        kws_html = ""
        if missing_kws:
            kws_pills = " ".join([
                f'<span style="display: inline-block; background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; margin: 2px;">{html.escape(str(k))}</span>' 
                for k in missing_kws[:5]
            ])
            kws_html = f"""
            <div style="margin-top: 10px; padding: 8px 12px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">🎯 Target ATS Keywords to Add:</div>
                <div style="margin-top: 4px;">{kws_pills}</div>
            </div>
            """

        # Tailored Headline Pitch
        headline_html = ""
        if headline:
            headline_html = f"""
            <div style="margin-top: 12px; padding: 10px 14px; background: linear-gradient(to right, #eef2ff, #f8fafc); border: 1px solid #c7d2fe; border-radius: 8px;">
                <div style="font-size: 11px; font-weight: 800; color: #3730a3; text-transform: uppercase; letter-spacing: 0.5px;">✨ AI-Tailored Resume Pitch for ATS:</div>
                <div style="margin-top: 4px; font-size: 13px; color: #1e1b4b; font-style: italic; line-height: 1.4;">&ldquo;{headline}&rdquo;</div>
            </div>
            """

        job_cards_html += f"""
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
            
            <!-- Card Header -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
                <tr>
                    <td valign="top">
                        <div style="display: inline-block; background-color: {flag_bg}; color: {flag_color}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
                            {flag_pill}
                        </div>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                            {idx}. {title}
                        </h2>
                        <div style="font-size: 13px; color: #475569; margin-top: 4px;">
                            <strong style="color: #0f172a;">{company}</strong> &bull; 📍 {location} &bull; ⏱️ <span style="color: #64748b;">{posted} via {source}</span>
                        </div>
                    </td>
                    <td valign="top" align="right" style="width: 110px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7; padding: 6px 12px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 18px; font-weight: 900; color: #065f46; line-height: 1;">{score}%</div>
                            <div style="font-size: 10px; font-weight: 800; color: #047857; text-transform: uppercase; margin-top: 2px;">{verdict}</div>
                        </div>
                    </td>
                </tr>
            </table>

            {f'<p style="font-size: 13px; color: #475569; margin: 8px 0; line-height: 1.5;">{summary}</p>' if summary else ''}
            {headline_html}
            {kws_html}
            {hm_html}

            <!-- CTA Buttons -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; text-align: center;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="left" style="width: 50%;">
                            <a href="{app_url}/app" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #f1f5f9; color: #0f172a; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; border: 1px solid #cbd5e1;">
                                📋 Open in Dashboard
                            </a>
                        </td>
                        <td align="right" style="width: 50%;">
                            <a href="{apply_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; box-shadow: 0 2px 4px rgba(79,70,229,0.3);">
                                🚀 Apply on Official Site &rarr;
                            </a>
                        </td>
                    </tr>
                </table>
            </div>

        </div>
        """

    test_banner = ""
    if is_test:
        test_banner = """
        <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; text-align: center; color: #92400e; font-size: 13px; font-weight: 700;">
            🧪 <strong>Test Notification Alert:</strong> This preview confirms your automated email alert delivery is active and working.
        </div>
        """

    full_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RateYourCV High-Match Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 620px; margin: 0 auto;">
            
            {test_banner}

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0B1120 0%, #1e1b4b 60%, #0f172a 100%); color: #ffffff; padding: 26px; border-radius: 16px; margin-bottom: 22px; text-align: left; box-shadow: 0 4px 12px rgba(11,17,32,0.15);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td>
                            <div style="display: inline-block; background-color: rgba(6,182,212,0.2); border: 1px solid #06b6d4; color: #67e8f9; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                ⚡ Live Automated Radar Alert
                            </div>
                            <h1 style="margin: 12px 0 6px 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                                🎯 {len(jobs)} High-Match Roles Found (≥{min_match_score}% ATS Fit)
                            </h1>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                Personalized opportunities for <strong>{safe_name}</strong> &bull; {today_str}
                            </p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Job Listings -->
            {job_cards_html}

            <!-- Footer -->
            <div style="text-align: center; font-size: 12px; color: #64748b; padding: 20px 0; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">RateYourCV AI &bull; Autonomous Career Copilot</div>
                <div>You received this alert because high-match notifications are enabled on your account.</div>
                <div style="margin-top: 8px;">
                    <a href="{app_url}/app" style="color: #4f46e5; font-weight: 700; text-decoration: none;">Manage Alert Preferences in Dashboard</a>
                </div>
            </div>

        </div>
    </body>
    </html>
    """
    return full_html


def send_high_match_alert(
    user_id: int, 
    test_mode: bool = False, 
    custom_recipient: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates and dispatches high-match job alert email to the specified user.
    Uses SMTP credentials from environment variables (.env).
    """
    db = JobDatabase()
    user = db.get_user_by_id(user_id)
    if not user:
        return {"status": "error", "message": f"User ID {user_id} not found."}

    settings = db.get_user_notification_settings(user_id)
    
    if not test_mode and not settings.get("alerts_enabled", True):
        return {"status": "disabled", "message": "Email alerts are disabled in user preferences."}

    # Determine recipient
    recipient = (custom_recipient or settings.get("alert_email") or user.get("email") or "").strip()
    # Fallback to .env SMTP_RECIPIENT_EMAIL if user email is placeholder
    if not recipient or "example.com" in recipient or "rateyourcv.com" in recipient:
        recipient = (os.environ.get("SMTP_RECIPIENT_EMAIL") or os.environ.get("SMTP_SENDER_EMAIL") or recipient).strip()

    if not recipient:
        return {"status": "error", "message": "No valid recipient email address configured."}

    min_score = settings.get("min_match_score", 70)
    regions = settings.get("preferred_regions", ["all"])
    target_region = regions[0] if regions else "all"

    # Fetch jobs
    if test_mode:
        jobs = db.get_jobs(user_id=user_id, min_score=min_score, limit=3)
        if not jobs:
            jobs = db.get_jobs(user_id=user_id, limit=3)
    else:
        jobs = db.get_unnotified_high_match_jobs(
            user_id=user_id, 
            min_match_score=min_score, 
            region=target_region, 
            limit=10
        )

    if not jobs:
        return {
            "status": "skipped", 
            "message": f"Zero new unnotified high-match jobs (≥{min_score}%) found for {user.get('username')}."
        }

    # SMTP configuration
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    sender_email = os.environ.get("SMTP_SENDER_EMAIL", "").strip()
    sender_password = os.environ.get("SMTP_SENDER_PASSWORD", "").strip()

    if not sender_email or not sender_password:
        return {
            "status": "error",
            "message": "SMTP_SENDER_EMAIL or SMTP_SENDER_PASSWORD is not configured in .env."
        }

    candidate_name = user.get("full_name") or user.get("username") or "Candidate"
    html_content = build_alert_email_html(
        jobs=jobs, 
        candidate_name=candidate_name, 
        min_match_score=min_score, 
        is_test=test_mode
    )

    try:
        msg = MIMEMultipart("alternative")
        today_short = datetime.now().strftime("%b %d")
        
        if test_mode:
            msg["Subject"] = f"[TEST ALERT] 🎯 Top ATS Matches for {candidate_name} ({len(jobs)} Opportunities) - RateYourCV"
        else:
            msg["Subject"] = f"🎯 {len(jobs)} High-Match Tech Opportunities (≥{min_score}% ATS Fit) - {today_short}"
            
        msg["From"] = f"RateYourCV AI Alerts <{sender_email}>"
        msg["To"] = recipient

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(smtp_server, smtp_port, timeout=15)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient, msg.as_string())
        server.quit()

        # Record sent alert log to prevent duplicate emails
        if not test_mode:
            job_ids_scores = [(j["id"], int(j.get("match_score", 0))) for j in jobs]
            db.record_sent_alerts(user_id, job_ids_scores)

        print(f"[✓] Successfully dispatched alert email with {len(jobs)} jobs to {recipient}!")
        return {
            "status": "success",
            "recipient": recipient,
            "jobs_count": len(jobs),
            "is_test": test_mode,
            "message": f"Successfully dispatched alert email with {len(jobs)} high-match jobs to {recipient}!"
        }
    except Exception as e:
        print(f"[!] Email dispatch error: {e}")
        return {
            "status": "error",
            "message": f"SMTP dispatch failed: {str(e)}"
        }


def dispatch_all_user_alerts() -> Dict[str, Any]:
    """Iterates through all registered users with alerts enabled and sends their high-match digests."""
    db = JobDatabase()
    with db._get_connection() as conn:
        cur = db._execute(conn, """
        SELECT u.id, u.username, u.email 
        FROM users u
        LEFT JOIN user_notification_settings uns ON u.id = uns.user_id
        WHERE COALESCE(uns.alerts_enabled, 1) = 1
        """)
        users = [dict(r) for r in cur.fetchall()]

    results = []
    for u in users:
        res = send_high_match_alert(user_id=u["id"], test_mode=False)
        results.append({"user_id": u["id"], "username": u["username"], "result": res})

    return {
        "status": "completed",
        "total_users_checked": len(users),
        "results": results
    }
