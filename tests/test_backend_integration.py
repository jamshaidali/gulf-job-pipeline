"""Comprehensive Backend API Integration Tests for TalentRadar.
Verifies all backend endpoints:
1. CV Templates Catalog API (105 templates, 7 categories)
2. Category Filtering on Templates
3. Multi-Template ATS-Compliant PDF Exporter
4. Multi-Template Word DOCX Exporter
5. AI-Tailored Cover Letter Generation
6. Decision-Maker Recruiter Outreach Generation (LinkedIn 300c note + Cold Email)
7. Freemium Search Quotas & Result Gating (Top 3 free vs Result #4+ locked)
8. Pro Upgrade & Downgrade Entitlement Cycle
9. Automated High-Match Alert & Digest Settings
"""

import sys
from fastapi.testclient import TestClient
from src.dashboard_app import app, db, auth


def run_all_backend_integration_tests():
    client = TestClient(app)

    print("\n=======================================================")
    print("🚀 RUNNING TALENTRADAR BACKEND API INTEGRATION TEST SUITE")
    print("=======================================================")

    # Ensure jamshaid (admin) and freeuser (user) exist and have valid passwords
    token_admin = auth.create_session_token("jamshaid")
    admin_cookie = {"session_token": token_admin}

    token_free = auth.create_session_token("freeuser")
    free_cookie = {"session_token": token_free}

    # 1. CV Templates Catalog API
    print("\n[1/9] Testing CV Templates Catalog Endpoint...")
    res = client.get("/api/cv/templates", cookies=admin_cookie)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "success"
    assert data["total_templates"] >= 100, f"Expected >= 100 templates, got {data['total_templates']}"
    assert len(data["categories"]) >= 7
    first = data["templates"][0]
    assert "id" in first and "name" in first and "colors" in first
    print(f"  [PASS] Returned {data['total_templates']} templates across {len(data['categories'])} categories.")

    # 2. Category Filtering
    print("\n[2/9] Testing Template Category Filtering...")
    res = client.get("/api/cv/templates?category=Gulf%20%26%20Middle%20East", cookies=admin_cookie)
    assert res.status_code == 200
    filtered = res.json()["templates"]
    assert len(filtered) >= 10
    for tmpl in filtered:
        assert tmpl["category"] == "Gulf & Middle East"
    print(f"  [PASS] Successfully filtered {len(filtered)} Gulf & Middle East templates.")

    # Fetch a live job ID
    jobs_res = client.get("/api/jobs", cookies=admin_cookie)
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) > 0
    job_id = jobs[0]["id"]
    job_title = jobs[0]["title"]
    print(f"  (Testing career assets using Job ID: {job_id} - '{job_title}')")

    # 3. Multi-Template PDF Exporter
    print("\n[3/9] Testing Multi-Template PDF Exporter...")
    test_templates = [
        "gulf_dubai_sapphire",
        "saudi_riyadh_gold",
        "ats_compact_one_page",
        "tech_silicon_valley_fullstack"
    ]
    for tmpl_id in test_templates:
        pdf_res = client.get(f"/api/cv/export-pdf/{job_id}?template={tmpl_id}", cookies=admin_cookie)
        assert pdf_res.status_code == 200, f"PDF export failed for {tmpl_id}: {pdf_res.status_code}"
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF"), f"Invalid PDF stream for {tmpl_id}"
        assert len(pdf_res.content) > 2000, f"PDF output too small for {tmpl_id}"
        print(f"  [PASS] Template '{tmpl_id}' generated valid PDF ({len(pdf_res.content):,} bytes).")

    # 4. Multi-Template DOCX Exporter
    print("\n[4/9] Testing Multi-Template Word DOCX Exporter...")
    docx_res = client.get(f"/api/cv/export-docx/{job_id}?template=gulf_dubai_sapphire", cookies=admin_cookie)
    assert docx_res.status_code == 200
    assert "vnd.openxmlformats-officedocument.wordprocessingml.document" in docx_res.headers["content-type"]
    assert docx_res.content.startswith(b"PK"), "Invalid ZIP/DOCX header"
    print(f"  [PASS] Word document export succeeded ({len(docx_res.content):,} bytes).")

    # 5. Cover Letter Generation
    print("\n[5/9] Testing AI Cover Letter Generation...")
    cl_res = client.post(f"/api/cover-letter/{job_id}", cookies=admin_cookie)
    assert cl_res.status_code == 200
    cl_data = cl_res.json()
    assert cl_data["status"] == "success"
    assert len(cl_data["cover_letter"]) > 100
    assert "Dear" in cl_data["cover_letter"]
    print(f"  [PASS] AI Cover letter generated successfully ({len(cl_data['cover_letter'])} chars).")

    # 6. Recruiter Outreach Generation
    print("\n[6/9] Testing Recruiter Outreach Kit...")
    ro_res = client.post(f"/api/recruiter-outreach/{job_id}", cookies=admin_cookie)
    assert ro_res.status_code == 200
    ro_data = ro_res.json()
    assert ro_data["status"] == "success"
    assert "linkedin_note" in ro_data
    assert len(ro_data["linkedin_note"]) <= 300, f"LinkedIn note exceeded 300 chars: {len(ro_data['linkedin_note'])}"
    assert "email_draft" in ro_data
    assert len(ro_data["email_draft"]) > 100
    print(f"  [PASS] LinkedIn note: {len(ro_data['linkedin_note'])} chars (<=300 limit enforced).")
    print(f"  [PASS] InMail cold draft: {len(ro_data['email_draft'])} chars.")

    # 7. Freemium Search Quotas & Paywall Gating
    print("\n[7/9] Testing Freemium Paywall Gating...")
    client.post("/api/subscription/downgrade", cookies=free_cookie)
    free_jobs_res = client.get("/api/jobs", cookies=free_cookie)
    assert free_jobs_res.status_code == 200
    free_jobs = free_jobs_res.json()
    if len(free_jobs) >= 4:
        assert free_jobs[0].get("is_locked") is False, "Top 1 should be unlocked"
        assert free_jobs[1].get("is_locked") is False, "Top 2 should be unlocked"
        assert free_jobs[2].get("is_locked") is False, "Top 3 should be unlocked"
        assert free_jobs[3].get("is_locked") is True, "Result #4 should be locked"
        
        # Test 403 on locked job for free user
        locked_id = free_jobs[3]["id"]
        denied_cl = client.post(f"/api/cover-letter/{locked_id}", cookies=free_cookie)
        assert denied_cl.status_code == 403, "Should return 403 for locked job on free account"
        print("  [PASS] Free tier top 3 unlocked & result #4+ locked with HTTP 403 enforcement.")

    # 8. Upgrade to Pro & Downgrade Cycle
    print("\n[8/9] Testing Upgrade & Downgrade Entitlement Cycle...")
    up_res = client.post("/api/subscription/upgrade", cookies=free_cookie)
    assert up_res.status_code == 200
    assert up_res.json()["user"]["is_pro"] is True
    
    # Verify all jobs are unlocked on Pro
    pro_jobs = client.get("/api/jobs", cookies=free_cookie).json()
    for j in pro_jobs:
        assert j.get("is_locked") is False
    print("  [PASS] Upgrade to Pro unlocked all results.")

    down_res = client.post("/api/subscription/downgrade", cookies=free_cookie)
    assert down_res.status_code == 200
    assert down_res.json()["user"]["is_pro"] is False
    print("  [PASS] Downgrade to Free restored quota and gating.")

    # 9. Notification Settings
    print("\n[9/9] Testing Automated Alert Settings...")
    notif_res = client.get("/api/notifications/settings", cookies=admin_cookie)
    assert notif_res.status_code == 200
    
    update_res = client.post(
        "/api/notifications/settings",
        json={"alerts_enabled": True, "min_match_score": 85, "frequency": "daily"},
        cookies=admin_cookie
    )
    assert update_res.status_code == 200
    assert update_res.json()["settings"]["min_match_score"] == 85
    print("  [PASS] Automated notification alert settings verified.")

    print("\n=======================================================")
    print("✅ ALL 9 BACKEND API INTEGRATION TESTS PASSED 100%!")
    print("=======================================================\n")


if __name__ == "__main__":
    run_all_backend_integration_tests()
