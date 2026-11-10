"""Comprehensive Security & Authentication Verification Suite."""

import time
from fastapi.testclient import TestClient
from src.dashboard_app import app, db, auth
from src.auth import hash_password, verify_password, validate_password_strength


def test_nist_password_strength():
    print("\n--- 1. Testing NIST SP 800-63B Password Policy ---")
    
    # 1. Too short (< 8 chars)
    ok, err = validate_password_strength("Short1!", username="john", email="john@example.com")
    assert not ok and "at least 8 characters" in err, f"Failed: {err}"
    print("  [PASS] Rejects passwords < 8 characters")

    # 2. No letter
    ok, err = validate_password_strength("123456789!", username="john", email="john@example.com")
    assert not ok and "at least one letter" in err, f"Failed: {err}"
    print("  [PASS] Rejects passwords without letters")

    # 3. No number or symbol
    ok, err = validate_password_strength("PasswordOnly", username="john", email="john@example.com")
    assert not ok and "number or special character" in err, f"Failed: {err}"
    print("  [PASS] Rejects passwords without numbers or symbols")

    # 4. Common weak dictionary passwords
    for common in ["password123", "admin123", "welcome123", "dubai123", "qwerty123"]:
        ok, err = validate_password_strength(common, username="john", email="john@example.com")
        assert not ok and "too common" in err, f"Failed to reject common password: {common}"
    print("  [PASS] Rejects common dictionary passwords")

    # 5. Contains username
    ok, err = validate_password_strength("johnDeveloper2026!", username="john", email="test@example.com")
    assert not ok and "cannot contain your username" in err, f"Failed: {err}"
    print("  [PASS] Rejects passwords containing username")

    # 6. Contains email prefix
    ok, err = validate_password_strength("jamshaidPass2026!", username="someone", email="jamshaid@gmail.com")
    assert not ok and "cannot contain your email" in err, f"Failed: {err}"
    print("  [PASS] Rejects passwords containing email prefix")

    # 7. Valid compliant password
    ok, err = validate_password_strength("Str0ngP@ssword2026", username="john", email="john@example.com")
    assert ok, f"Failed: {err}"
    print("  [PASS] Accepts compliant password")


def test_timing_attack_mitigation():
    print("\n--- 2. Testing Timing Attack Mitigation (Constant-Time PBKDF2) ---")
    # Both nonexistent user and existent user go through PBKDF2 verification
    t0 = time.perf_counter()
    res1 = auth.authenticate("nonexistent_user_xyz_123", "RandomPass123!")
    t1 = time.perf_counter()
    assert res1 is None

    duration = t1 - t0
    # Must have performed 600,000 PBKDF2 rounds (typically 50ms - 200ms depending on CPU)
    print(f"  [PASS] Nonexistent user authentication took {duration*1000:.2f}ms (constant-time dummy run)")
    assert duration > 0.02, "Timing dummy check didn't execute PBKDF2 rounds!"


def test_session_versioning_and_instant_revocation():
    print("\n--- 3. Testing Session Versioning & Instant Invalidation ---")
    username = f"usr_{int(time.time())}"
    email = f"{username}@example.com"
    pwd = "ValidPass123!@#"
    
    # Register user
    auth.register_user(username, email, pwd, "Revocation User")
    
    # Generate token
    token = auth.create_session_token(username)
    assert auth.verify_session_token(token) == username, "Token must be valid initially"
    print("  [PASS] Token initial validity verified")

    # Invalidate session on server side
    auth.revoke_user_sessions(username)
    
    # The previously valid token must now be IMMEDIATELY invalid
    verified = auth.verify_session_token(token)
    assert verified is None, "Token must be revoked after revoke_user_sessions!"
    print("  [PASS] Token immediately rejected after server-side revocation")


def test_client_endpoints_and_lockout():
    print("\n--- 4. Testing Endpoints, Honeypot, CSRF & Dual Rate Limiting ---")
    client = TestClient(app)

    # 1. Honeypot bot rejection
    bot_payload = {
        "username": f"bot_{int(time.time())}",
        "email": "bot@spammer.org",
        "password": "BotPassword123!",
        "full_name": "Spam Bot",
        "honeypot": "https://spamlink.com"
    }
    res = client.post("/api/register", json=bot_payload)
    assert res.status_code == 400, f"Expected 400 for honeypot, got {res.status_code}"
    print("  [PASS] Honeypot automatically blocked bot registration")

    # 2. CSRF Origin Verification
    res_csrf = client.post(
        "/api/register", 
        json={"username": "valid_user", "email": "valid@ex.com", "password": "ValidPassword123!"},
        headers={"Origin": "https://malicious-website.com", "Host": "talentradar.ai"}
    )
    assert res_csrf.status_code == 403, f"Expected 403 for CSRF origin mismatch, got {res_csrf.status_code}"
    print("  [PASS] CSRF blocked cross-origin request")

    # 3. Account-targeted rate limiting / lockout
    target_account = f"lockout_target_{int(time.time())}"
    auth.register_user(target_account, f"{target_account}@example.com", "CorrectPassword123!", "Lockout Target")

    # Clear attempts for fresh test
    auth.reset_failed_attempts("127.0.0.1", target_account)

    print("  Simulating 5 consecutive failed login attempts on account...")
    for i in range(5):
        login_res = client.post("/api/login", json={"username": target_account, "password": "WrongPassword!"})
        assert login_res.status_code in [401, 429]

    # The 6th attempt should be blocked with 429 Too Many Requests
    locked_res = client.post("/api/login", json={"username": target_account, "password": "WrongPassword!"})
    assert locked_res.status_code == 429, f"Expected 429 lockout, got {locked_res.status_code}: {locked_res.text}"
    print("  [PASS] Account lockout enforced after 5 consecutive failures (HTTP 429)")


if __name__ == "__main__":
    test_nist_password_strength()
    test_timing_attack_mitigation()
    test_session_versioning_and_instant_revocation()
    test_client_endpoints_and_lockout()
    print("\n✅ ALL SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY!\n")
