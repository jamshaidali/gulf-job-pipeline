# 🌴 Gulf Job Hunter & Daily CV-Tailoring Pipeline

An automated daily intelligence pipeline that monitors new job openings across the **Gulf Region (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman)** posted in the **last 24 hours**, identifies hiring managers and recruiters with their LinkedIn profiles, and uses AI to analyze your CV and generate tailored improvements.

---

## 🌟 Key Features

1. **Daily 24-Hour Job Scraping**:
   - Monitors LinkedIn guest job APIs and regional job boards across Dubai, Abu Dhabi, Riyadh, Jeddah, Doha, etc.
   - Strictly filters for postings in the last 24 hours (`f_TPR=r86400`).
2. **Hiring Manager & Recruiter Intelligence**:
   - Identifies likely recruiters and department heads.
   - Extracts their names and LinkedIn profiles.
   - Generates pre-written **LinkedIn Connection Notes (< 300 characters)** and full InMail/Email pitches.
3. **AI CV Match & Tailoring Engine**:
   - Computes ATS match score (0-100%).
   - Identifies critical missing keywords & technical skills.
   - Generates action-oriented STAR bullet point suggestions tailored to each specific job.
   - Generates tailored headline and summary.
4. **Daily Digest Reports & Dashboards**:
   - Generates an interactive **HTML Dashboard** (`data/output/daily_digest_YYYY-MM-DD.html`).
   - Generates a clean **Markdown Summary** (`data/output/daily_digest_YYYY-MM-DD.md`).
   - Optional webhook alerts to Telegram, Discord, or Email.
5. **Flexible Scheduling**:
   - Run on-demand via CLI or continuously with the built-in daily scheduler or Linux cron.

---

## 🚀 Quick Start Guide

### 1. Add Your CV
Drop your CV / Resume into the `data/resumes/` folder:
- Supported formats: `.pdf`, `.docx`, `.txt`, `.md`
- Example: `data/resumes/my_cv.pdf`

### 2. Run On-Demand
Run the pipeline to fetch today's jobs and tailor your CV:
```bash
.venv/bin/python main.py --cv data/resumes/my_cv.pdf
```

You can also specify custom roles or locations:
```bash
.venv/bin/python main.py --roles "Senior Python Engineer, AI Engineer" --locations "Dubai, Riyadh" --limit 10
```

### 3. Run Daily Scheduled Job
To run the automated scheduler daemon (runs every morning at 08:00 AM Gulf time):
```bash
.venv/bin/python run_daily.py
```

Or add it to your system crontab:
```cron
# Run daily at 8:00 AM
0 8 * * * cd /home/dev/.gemini/antigravity/scratch/gulf_job_pipeline && .venv/bin/python main.py >> data/output/cron.log 2>&1
```

---

## ⚙️ Configuration (`config.yaml`)

Edit `config.yaml` to customize:
- `preferred_countries` & `preferred_cities`
- `ai_engine` (Gemini API or heuristic matching)
- `notifications` (Discord webhook, Telegram bot token, or SMTP email)
- `scheduler.run_time`
