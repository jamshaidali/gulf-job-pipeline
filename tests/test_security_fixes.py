"""Regression tests for the security audit fixes (forged sessions, default credentials,
self-service Pro upgrades, unauthenticated test endpoints, job deletion, IP spoofing, lockout DoS)."""

import hashlib
import hmac
import time

import pytest
from fastapi.testclient import TestClient

from src import auth as auth_module
from src.auth import AuthManager, hash_password
from src.dashboard_app import app, db, auth

OLD_HARDCODED_SECRET = b"gulf_pk_jobs_secret_key_2026_change_in_production"
STRONG_PW = "Zq9!vplmxR"


def _uniq(prefix: str) -> str:
    return f"{prefix}{int(time.time() * 1000) % 10_000_000}"


def _register(client: TestClient, prefix: str):
    name = _uniq(prefix)
    res = client.post("/api/register", json={"username": name, "email": f"{name}@mail.test", "password": STRONG_PW})
    assert res.status_code == 200, res.text
    return name, {"session_token": res.cookies.get("session_token")}


@pytest.fixture(autouse=True)
def _clean_rate_limits():
    auth.ip_attempts.clear()
    auth.account_attempts.clear()
    auth.registration_attempts.clear()
    yield


def test_old_hardcoded_secret_cannot_forge_admin_session():
    payload = f"admin:{int(time.time()) + 3600}:1"
    sig = hmac.new(OLD_HARDCODED_SECRET, payload.encode(), hashlib.sha256).hexdigest()
    res = TestClient(app).get("/api/me", cookies={"session_token": f"{payload}:{sig}"})
    assert res.status_code == 401


def test_missing_secret_is_random_locally_and_fatal_in_production(monkeypatch):
    monkeypatch.delenv("DASHBOARD_SESSION_SECRET", raising=False)
    for var in ("VERCEL", "RENDER", "APP_ENV"):
        monkeypatch.delenv(var, raising=False)
    a, b = AuthManager({}), AuthManager({})
    assert a.secret_key != b.secret_key and len(a.secret_key) >= 64

    monkeypatch.setenv("VERCEL", "1")
    with pytest.raises(RuntimeError):
        AuthManager({})


def test_no_default_admin_password(monkeypatch):
    monkeypatch.delenv("DASHBOARD_PASSWORD", raising=False)
    monkeypatch.setenv("DASHBOARD_SESSION_SECRET", "x" * 64)
    mgr = AuthManager({"dashboard_auth": {"password": ""}})
    assert mgr.password == ""
    assert mgr.authenticate("admin", "admin123") is None
    assert mgr.get_user_profile("admin") is None


def test_legacy_three_part_tokens_rejected():
    payload = f"someone:{int(time.time()) + 3600}"
    sig = hmac.new(auth.secret_key, payload.encode(), hashlib.sha256).hexdigest()
    assert auth.verify_session_token(f"{payload}:{sig}") is None


def test_token_for_deleted_or_unknown_user_rejected():
    token = auth.create_session_token(_uniq("ghost"))
    assert auth.verify_session_token(token) is None


def test_sha256_hash_cannot_be_replayed_as_password():
    sha = hashlib.sha256(b"Secret123!").hexdigest()
    assert auth_module.verify_password("Secret123!", sha)
    assert not auth_module.verify_password(sha, sha)


def test_free_user_cannot_self_upgrade_or_reset_quota(monkeypatch):
    monkeypatch.delenv("ENABLE_TEST_ENDPOINTS", raising=False)
    client = TestClient(app)
    _, cookie = _register(client, "mallory")
    assert client.post("/api/subscription/upgrade", cookies=cookie).status_code == 403
    assert client.post("/api/subscription/reset-quota", cookies=cookie).status_code == 403
    assert client.get("/api/me", cookies=cookie).json()["user"]["role"] == "user"


def test_self_upgrade_still_works_in_test_mode(monkeypatch):
    monkeypatch.setenv("ENABLE_TEST_ENDPOINTS", "1")
    client = TestClient(app)
    _, cookie = _register(client, "tester")
    res = client.post("/api/subscription/upgrade", cookies=cookie)
    assert res.status_code == 200 and res.json()["user"]["role"] == "pro"


def test_test_reset_endpoint_hidden_without_flag(monkeypatch):
    monkeypatch.delenv("ENABLE_TEST_ENDPOINTS", raising=False)
    assert TestClient(app).post("/api/test/reset-rate-limit").status_code == 404
    monkeypatch.setenv("ENABLE_TEST_ENDPOINTS", "1")
    assert TestClient(app).post("/api/test/reset-rate-limit").status_code == 200


def test_only_admin_can_delete_jobs_and_set_roles():
    client = TestClient(app)
    job_id = _uniq("secjob_")
    db.save_job({"id": job_id, "title": "Security Test Role", "company": "Acme", "location": "Dubai",
                 "apply_url": "https://example.com", "description": "x"}, country_tag="Gulf")

    victim_name, user_cookie = _register(client, "plainuser")
    assert client.delete(f"/api/jobs/{job_id}", cookies=user_cookie).status_code == 403
    assert db.get_job(job_id) is not None

    victim = db.get_user_by_username(victim_name)
    assert client.post(f"/api/admin/users/{victim['id']}/role", json={"role": "pro"},
                       cookies=user_cookie).status_code == 403

    admin_name = _uniq("adm")
    db.create_user(username=admin_name, email=f"{admin_name}@mail.test",
                   password_hash=hash_password(STRONG_PW), full_name="Admin", role="admin")
    admin_cookie = {"session_token": auth.create_session_token(admin_name)}
    assert client.post(f"/api/admin/users/{victim['id']}/role", json={"role": "pro"},
                       cookies=admin_cookie).status_code == 200
    assert db.get_user_by_id(victim["id"])["role"] == "pro"
    assert client.delete(f"/api/jobs/{job_id}", cookies=admin_cookie).status_code == 200
    assert db.get_job(job_id) is None


def test_spoofed_forwarding_headers_do_not_bypass_ip_limit(monkeypatch):
    for var in ("VERCEL", "RENDER", "TRUSTED_PROXY_HOPS", "CLIENT_IP_HEADER"):
        monkeypatch.delenv(var, raising=False)
    client = TestClient(app)
    codes = []
    for i in range(12):
        codes.append(client.post(
            "/api/login",
            json={"username": f"nobody{i}", "password": "wrong-pass"},
            headers={"X-Forwarded-For": f"1.2.3.{i}", "CF-Connecting-IP": f"5.6.7.{i}", "X-Real-IP": f"9.9.9.{i}"},
        ).status_code)
    assert 429 in codes


def test_attacker_cannot_lock_victim_out_from_another_ip():
    victim = _uniq("victim")
    auth.register_user(victim, f"{victim}@mail.test", STRONG_PW, "Victim")
    for _ in range(6):
        auth.record_failed_attempt("6.6.6.6", victim)
    assert auth.check_rate_limit("6.6.6.6", victim)[0] is False   # attacker is locked
    assert auth.check_rate_limit("10.0.0.5", victim)[0] is True   # real user still gets in


def test_test_alert_cannot_target_arbitrary_addresses():
    client = TestClient(app)
    _, cookie = _register(client, "spammer")
    res = client.post("/api/notifications/test", json={"email": "stranger@elsewhere.test"}, cookies=cookie)
    assert res.status_code == 400
