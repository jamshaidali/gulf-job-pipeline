"""Launches the Job Hunter & AI Feedback Web Dashboard on http://localhost:8000."""

import uvicorn

if __name__ == "__main__":
    print("=" * 65)
    print("🚀 LAUNCHING JOB TRACKER & AI FEEDBACK WEB DASHBOARD")
    print("=" * 65)
    print("[*] Dashboard URL: http://localhost:8000")
    print("[*] Press Ctrl+C to stop the server.")
    print("=" * 65)
    uvicorn.run("src.dashboard_app:app", host="127.0.0.1", port=8000, reload=True)
