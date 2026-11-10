"""Multi-Tenancy & User Isolation Automated Test Suite."""

import time
from fastapi.testclient import TestClient
from src.dashboard_app import app, db, auth


def test_user_data_isolation():
    print("\n--- 1. Testing Multi-Tenant User Isolation (Status & Trash) ---")
    client = TestClient(app)

    ts = int(time.time())
    alice_username = f"alice_{ts % 100000}"
    bob_username = f"bob_{ts % 100000}"

    # 1. Register Alice
    res_a = client.post("/api/register", json={
        "username": alice_username,
        "email": f"{alice_username}@example.com",
        "password": "Password123!@#",
        "full_name": "Alice Smith"
    })
    assert res_a.status_code == 200, f"Alice registration failed: {res_a.text}"
    alice_cookie = res_a.cookies.get("session_token")
    assert alice_cookie, "Alice did not get session_token"

    # 2. Register Bob
    res_b = client.post("/api/register", json={
        "username": bob_username,
        "email": f"{bob_username}@example.com",
        "password": "Password123!@#",
        "full_name": "Bob Jones"
    })
    assert res_b.status_code == 200, f"Bob registration failed: {res_b.text}"
    bob_cookie = res_b.cookies.get("session_token")
    assert bob_cookie, "Bob did not get session_token"

    print("  [PASS] Alice and Bob successfully registered with separate accounts")

    # 3. Get initial jobs list
    res_jobs = client.get("/api/jobs", cookies={"session_token": alice_cookie})
    jobs = res_jobs.json()
    assert len(jobs) > 0, "No jobs in database to test against"
    test_job_1 = jobs[0]["id"]
    test_job_2 = jobs[1]["id"] if len(jobs) > 1 else test_job_1

    # 4. Alice marks test_job_1 as 'applied'
    res_status = client.post(
        f"/api/jobs/{test_job_1}/status",
        json={"status": "applied"},
        cookies={"session_token": alice_cookie}
    )
    assert res_status.status_code == 200, f"Status update failed: {res_status.text}"

    # 5. Check Alice's status for test_job_1
    alice_jobs = client.get("/api/jobs", cookies={"session_token": alice_cookie}).json()
    alice_target = next(j for j in alice_jobs if j["id"] == test_job_1)
    assert alice_target["status"] == "applied", f"Expected applied, got {alice_target['status']}"
    print("  [PASS] Alice sees job marked as 'applied'")

    # 6. Check Bob's status for test_job_1 -> MUST BE 'new' (ISOLATED!)
    bob_jobs = client.get("/api/jobs", cookies={"session_token": bob_cookie}).json()
    bob_target = next(j for j in bob_jobs if j["id"] == test_job_1)
    assert bob_target["status"] == "new", f"CRITICAL LEAK: Bob saw Alice's status! Got {bob_target['status']}"
    print("  [PASS] Bob sees the exact same job as 'new' (Multi-tenant status isolation verified)")

    # 7. Check Pipeline Stats Isolation
    alice_stats = client.get("/api/stats", cookies={"session_token": alice_cookie}).json()
    bob_stats = client.get("/api/stats", cookies={"session_token": bob_cookie}).json()
    assert alice_stats["applied_jobs"] >= 1, "Alice should have >= 1 applied job"
    assert bob_stats["applied_jobs"] == 0, f"Bob should have 0 applied jobs, got {bob_stats['applied_jobs']}"
    print("  [PASS] Pipeline statistics are isolated per user (Alice applied=1, Bob applied=0)")

    # 8. Trash Isolation: Alice trashes test_job_2
    client.post(
        f"/api/jobs/{test_job_2}/status",
        json={"status": "trash"},
        cookies={"session_token": alice_cookie}
    )
    alice_active = client.get("/api/jobs", cookies={"session_token": alice_cookie}).json()
    bob_active = client.get("/api/jobs", cookies={"session_token": bob_cookie}).json()

    alice_ids = [j["id"] for j in alice_active]
    bob_ids = [j["id"] for j in bob_active]

    assert test_job_2 not in alice_ids, "Alice should not see trashed job in active feed"
    assert test_job_2 in bob_ids, "Bob should still see job in his active feed even if Alice trashed it!"
    print("  [PASS] Trash isolation verified (Alice's trash does not affect Bob's feed)")


def test_preferences_isolation():
    print("\n--- 2. Testing Multi-Tenant Preferences & CV Isolation ---")
    client = TestClient(app)

    ts = int(time.time())
    user1 = f"dev_one_{ts % 100000}"
    user2 = f"dev_two_{ts % 100000}"

    c1 = client.post("/api/register", json={"username": user1, "email": f"{user1}@ex.com", "password": "Password123!@", "full_name": "Dev One"}).cookies.get("session_token")
    c2 = client.post("/api/register", json={"username": user2, "email": f"{user2}@ex.com", "password": "Password123!@", "full_name": "Dev Two"}).cookies.get("session_token")

    # User 1 updates preferences to custom stack
    client.post("/api/preferences", json={
        "candidate_name": "Dev One Custom",
        "primary_stack": ["Rust", "WebAssembly", "Go"],
        "default_roles": ["Blockchain Engineer"],
        "min_match_score": 80
    }, cookies={"session_token": c1})

    p1 = client.get("/api/preferences", cookies={"session_token": c1}).json()["preferences"]
    p2 = client.get("/api/preferences", cookies={"session_token": c2}).json()["preferences"]

    assert p1["candidate_name"] == "Dev One Custom"
    assert p1["primary_stack"] == ["Rust", "WebAssembly", "Go"]

    assert p2["candidate_name"] != "Dev One Custom", f"User 2 got User 1 candidate name!"
    assert p2["primary_stack"] != ["Rust", "WebAssembly", "Go"], f"User 2 got User 1 stack!"
    print("  [PASS] Preferences are strictly isolated in user_preferences table per user ID")


def test_gzip_compression_speed():
    print("\n--- 3. Testing GZip Speed Compression ---")
    client = TestClient(app)

    # Login admin/test user so we fetch full jobs payload (> 500 KB)
    token = auth.create_session_token("admin")
    
    # Query with and without Gzip header
    res_plain = client.get("/api/jobs", cookies={"session_token": token})
    res_gzip = client.get("/api/jobs", headers={"Accept-Encoding": "gzip"}, cookies={"session_token": token})
    
    plain_size = len(res_plain.content)
    gzip_encoded = res_gzip.headers.get("content-encoding")
    
    print(f"  Plain JSON payload size: {plain_size / 1024:.1f} KB")
    print(f"  Gzip Content-Encoding returned: {gzip_encoded}")
    assert gzip_encoded == "gzip", "FastAPI should return gzip encoded payload when client requests gzip"
    print("  [PASS] GZip compression is enabled and operating")


if __name__ == "__main__":
    test_user_data_isolation()
    test_preferences_isolation()
    test_gzip_compression_speed()
    print("\n✅ ALL PHASE 1 MULTI-TENANCY & ISOLATION TESTS PASSED!\n")
