"""Test script to verify Gmail SMTP settings and dispatch a test digest."""

import sys
from main import load_config
from src.notifier import Notifier

def main():
    config = load_config()
    notifier = Notifier(config)
    
    email_cfg = config.get("notifications", {}).get("email", {})
    pwd = email_cfg.get("sender_password", "").strip()
    
    if not pwd:
        print("\n[!] Error: 'sender_password' is empty in config.yaml.")
        print("[!] Please generate a 16-letter App Password from https://myaccount.google.com/apppasswords")
        print("[!] Then paste it into config.yaml under notifications -> email -> sender_password.\n")
        sys.exit(1)

    print(f"[*] Testing email delivery from {email_cfg.get('sender_email')} to {email_cfg.get('recipient_email')}...")
    
    sample_jobs = [
        {
            "title": "Senior Python / Django Engineer",
            "company": "Tech Corp Gulf",
            "location": "Dubai, UAE",
            "posted_ago": "1 hour ago",
            "apply_url": "https://ae.linkedin.com/jobs",
            "hiring_managers": [
                {"name": "Talent Partner", "role": "Technical Recruiter", "linkedin_url": "https://linkedin.com"}
            ],
            "cv_analysis": {
                "match_score": 90,
                "fit_verdict": "High Match",
                "summary": "Excellent alignment with Jamshaid Ali's Python, Django, PostgreSQL, and AWS profile.",
                "missing_keywords": ["FastAPI", "Celery", "Docker", "Redis"],
                "tailored_cv_bullets": [
                    {"suggested_bullet": "Architected high-scale REST APIs using Django & FastAPI, improving latency by 35%."}
                ]
            }
        }
    ]

    notifier.send_email(sample_jobs)

if __name__ == "__main__":
    main()
