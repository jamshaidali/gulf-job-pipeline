"""Notification Dispatcher for Daily Gulf & Pakistan Job Alerts with XSS Sanitization & Security Hardening."""

import os
import html
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List


def safe_url(url: Any, default: str = "#") -> str:
    """Validates URL scheme to prevent javascript: and data: URI injection attacks."""
    url_str = str(url or "").strip()
    if url_str.startswith("http://") or url_str.startswith("https://"):
        return html.escape(url_str)
    return default


class Notifier:
    """Sends distinct daily job alert emails for Gulf Region and Pakistan."""

    def __init__(self, config: Dict[str, Any]):
        self.cfg = config.get("notifications", {})
        self.enabled = self.cfg.get("enabled", False)

    def build_email_html(self, jobs: List[Dict[str, Any]], region_title: str = "Gulf Region", flag_emoji: str = "🌴") -> str:
        """Generates an email template with inline styles, strict HTML escaping, and secure link attributes."""
        today_str = datetime.now().strftime("%B %d, %Y")
        safe_region = html.escape(region_title)
        
        job_cards_html = ""
        for idx, job in enumerate(jobs, 1):
            title = html.escape(str(job.get("title", "Software Engineer")))
            company = html.escape(str(job.get("company", "Company")))
            location = html.escape(str(job.get("location", "Lahore, Pakistan")))
            posted = html.escape(str(job.get("posted_ago", "Past 24h")))
            apply_url = safe_url(job.get("apply_url"))
            source = html.escape(str(job.get("source", "Web")))
            
            cv_analysis = job.get("cv_analysis", {})
            score = int(cv_analysis.get("match_score", 75))
            verdict = html.escape(str(cv_analysis.get("fit_verdict", "Good Match")))
            summary = html.escape(str(cv_analysis.get("summary", "")))
            missing_kws = cv_analysis.get("missing_keywords", [])
            bullets = cv_analysis.get("tailored_cv_bullets", [])
            hiring_managers = job.get("hiring_managers", [])

            # Recruiters
            hm_rows = ""
            for hm in hiring_managers[:2]:
                hm_name = html.escape(str(hm.get("name", "Recruiter")))
                hm_role = html.escape(str(hm.get("role", "Talent Acquisition")))
                hm_url = safe_url(hm.get("linkedin_url"))
                hm_rows += f"""
                <div style="background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-top: 6px; font-size: 13px;">
                    <strong>{hm_name}</strong> &bull; <span style="color: #64748b;">{hm_role}</span><br>
                    <a href="{hm_url}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: none; font-weight: bold; font-size: 12px;">🔗 View LinkedIn Profile &rarr;</a>
                </div>
                """

            # Missing keywords pills
            kws_html = " ".join([f'<span style="display:inline-block; background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin: 2px;">{html.escape(str(k))}</span>' for k in missing_kws[:5]])

            # Bullets
            bullet_html = ""
            if bullets:
                first_bullet = html.escape(str(bullets[0].get("suggested_bullet", "")))
                bullet_html = f"""
                <div style="margin-top: 8px; font-size: 13px; color: #334155; line-height: 1.4;">
                    <strong style="color: #0f172a;">Recommended CV Bullet:</strong><br>
                    <span style="font-style: italic; color: #1e293b;">"{first_bullet}"</span>
                </div>
                """

            job_cards_html += f"""
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; color: #0f172a;">{idx}. {title}</h2>
                        <div style="font-size: 14px; color: #475569; margin-top: 3px;">
                            <strong>🏢 {company}</strong> &bull; 📍 {location} &bull; ⏱️ <span style="color: #0284c7;">{posted} ({source})</span>
                        </div>
                    </div>
                </div>

                <div style="margin: 10px 0; padding: 6px 12px; background-color: #ecfeff; border-left: 4px solid #06b6d4; border-radius: 4px; font-size: 13px; color: #0891b2;">
                    <strong>🎯 Match Score: {score}% ({verdict})</strong>
                </div>

                {f'<p style="font-size: 13px; color: #475569; margin: 8px 0;">{summary}</p>' if summary else ''}

                <!-- Actions -->
                <div style="margin-top: 14px; text-align: center;">
                    <a href="{apply_url}" target="_blank" rel="noopener noreferrer" style="display: block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;">🚀 Apply Directly on Job Portal &rarr;</a>
                </div>

                <!-- Recruiter Section -->
                <div style="margin-top: 14px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">👤 Hiring Manager & Recruiters</div>
                    {hm_rows}
                </div>

                <!-- CV Suggestions -->
                <div style="margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">✍️ Tailored CV Recommendations</div>
                    <div style="margin-top: 4px;">
                        <span style="font-size: 12px; color: #64748b;">Missing ATS Keywords:</span><br>
                        {kws_html}
                    </div>
                    {bullet_html}
                </div>
            </div>
            """

        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{safe_region} Job Alerts</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 22px; border-radius: 14px; text-align: center; margin-bottom: 20px;">
                    <span style="background-color: #06b6d4; color: #082f49; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Live 24h {safe_region} Feed</span>
                    <h1 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: 800;">{flag_emoji} {safe_region} Job Digest</h1>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">Personalized job matches for <strong>Jamshaid Ali</strong> &bull; {today_str}</p>
                    <div style="margin-top: 10px; display: inline-block; background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: bold;">
                        🔥 {len(jobs)} Fresh Opportunities Found (Past 24h)
                    </div>
                </div>

                <!-- Job Cards -->
                {job_cards_html}

                <!-- Footer -->
                <div style="text-align: center; font-size: 12px; color: #94a3b8; padding: 15px 0;">
                    Automated Job Hunter Pipeline &bull; Daily Scheduled Run ({safe_region})
                </div>
            </div>
        </body>
        </html>
        """
        return full_html

    def send_email(self, jobs: List[Dict[str, Any]], region_title: str = "Gulf Region", flag_emoji: str = "🌴"):
        """Sends the daily digest email directly to your inbox for the specified region."""
        em = self.cfg.get("email", {})
        
        # Load credentials safely from environment variables with config fallback
        sender = (os.environ.get("SMTP_SENDER_EMAIL") or em.get("sender_email") or "").strip()
        pwd = (os.environ.get("SMTP_SENDER_PASSWORD") or em.get("sender_password") or "").strip()
        recipient = (os.environ.get("SMTP_RECIPIENT_EMAIL") or em.get("recipient_email") or sender).strip()
        smtp_server = os.environ.get("SMTP_SERVER") or em.get("smtp_server", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT") or em.get("smtp_port", 587))
        
        if not sender or not pwd or not recipient:
            print(f"[!] Email skipped: Missing sender, password, or recipient configuration.")
            return

        print(f"[*] Dispatching {region_title} daily job digest email to {recipient}...")
        try:
            msg = MIMEMultipart("alternative")
            today_str = datetime.now().strftime("%b %d")
            msg["Subject"] = f"{flag_emoji} {region_title} Job Digest ({today_str}): {len(jobs)} New Opportunities (Past 24h)"
            msg["From"] = f"Job Hunter <{sender}>"
            msg["To"] = recipient

            html_content = self.build_email_html(jobs, region_title=region_title, flag_emoji=flag_emoji)
            msg.attach(MIMEText(html_content, "html"))

            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender, pwd)
            server.sendmail(sender, recipient, msg.as_string())
            server.quit()
            print(f"[✓] {region_title} digest email successfully sent to {recipient}!")
        except Exception as e:
            print(f"[!] Email dispatch failed: {e}")
