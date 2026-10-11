"""Authentication & Cryptographic Security Module for Job Dashboard."""

import os
import hmac
import hashlib
import secrets
import time
from typing import Optional, Dict, Any


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 (600,000 rounds) and unique cryptographic salt."""
    if salt is None:
        salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000)
    return f"pbkdf2:sha256:600000${salt.hex()}${dk.hex()}"


def verify_password(plain_password: str, stored_credential: str) -> bool:
    """Verifies password using constant-time comparison across PBKDF2, legacy SHA-256, or plaintext."""
    stored = stored_credential.strip()
    if not stored:
        return False

    # Check PBKDF2 format: pbkdf2:sha256:<rounds>$<salt_hex>$<hash_hex>
    if stored.startswith("pbkdf2:sha256:"):
        try:
            parts = stored.split("$")
            if len(parts) == 3:
                rounds_spec, salt_hex, hash_hex = parts
                rounds = int(rounds_spec.split(":")[2])
                salt = bytes.fromhex(salt_hex)
                expected_dk = bytes.fromhex(hash_hex)
                calculated_dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, rounds)
                return secrets.compare_digest(calculated_dk, expected_dk)
        except Exception:
            return False

    # Legacy SHA-256 fallback (constant time)
    legacy_sha = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    if secrets.compare_digest(legacy_sha, stored):
        return True

    # Legacy plaintext comparison (constant time)
    return secrets.compare_digest(plain_password.strip(), stored)


class AuthManager:
    """Manages secure password verification, HMAC session signing, and cookie tokens."""

    def __init__(self, config: Dict[str, Any]):
        self.auth_cfg = config.get("dashboard_auth", {})
        self.enabled = self.auth_cfg.get("enabled", True)
        
        # Read credentials from environment variables first (secure), then config.yaml
        self.username = (
            os.environ.get("DASHBOARD_USERNAME") 
            or self.auth_cfg.get("username") 
            or "admin"
        ).strip()
        
        self.password = (
            os.environ.get("DASHBOARD_PASSWORD") 
            or self.auth_cfg.get("password") 
            or "admin123"
        ).strip()
        
        secret = (
            os.environ.get("DASHBOARD_SESSION_SECRET") 
            or self.auth_cfg.get("session_secret") 
            or "gulf_pk_jobs_secret_key_2026_change_in_production"
        )
        self.secret_key = secret.encode("utf-8")
        
        try:
            self.session_duration_hours = int(
                os.environ.get("SESSION_DURATION_HOURS") 
                or self.auth_cfg.get("session_duration_hours", 72)
            )
        except (ValueError, TypeError):
            self.session_duration_hours = 72

        # Rate limiting state: {client_ip: {"count": int, "first_attempt": float}}
        self.failed_attempts: Dict[str, Dict[str, Any]] = {}

    def verify_credentials(self, username: str, password: str) -> bool:
        """Constant-time comparison for username and password."""
        user_matches = secrets.compare_digest(username.strip(), self.username)
        pwd_matches = verify_password(password, self.password)
        return user_matches and pwd_matches

    def create_session_token(self, username: str) -> str:
        """Generates a cryptographically signed tamper-proof HMAC session token."""
        expiry = int(time.time()) + (self.session_duration_hours * 3600)
        payload = f"{username}:{expiry}"
        signature = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"{payload}:{signature}"

    def verify_session_token(self, token: Optional[str]) -> Optional[str]:
        """Validates signature and expiry of session token."""
        if not token or ":" not in token:
            return None

        parts = token.split(":")
        if len(parts) != 3:
            return None

        username, expiry_str, received_sig = parts
        try:
            expiry = int(expiry_str)
            if time.time() > expiry:
                return None  # Expired
        except ValueError:
            return None

        payload = f"{username}:{expiry}"
        expected_sig = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
        
        if secrets.compare_digest(expected_sig, received_sig):
            return username
        return None

    def check_rate_limit(self, client_ip: str) -> bool:
        """Checks if client_ip is currently blocked (max 10 failed attempts within 15 minutes)."""
        now = time.time()

        # Housekeeping: prune old entries (> 1 hour) to prevent memory leak
        if len(self.failed_attempts) > 500:
            self.failed_attempts = {
                ip: rec for ip, rec in self.failed_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }

        record = self.failed_attempts.get(client_ip)
        if not record:
            return True

        # If 15-minute lockout window has elapsed, reset record
        if now - record["first_attempt"] > 900:
            del self.failed_attempts[client_ip]
            return True

        # Reject if limit exceeded
        if record["count"] >= 10:
            return False

        return True

    def record_failed_attempt(self, client_ip: str):
        """Records an actual failed login attempt for the given IP."""
        now = time.time()
        record = self.failed_attempts.get(client_ip)
        if not record or (now - record["first_attempt"] > 900):
            self.failed_attempts[client_ip] = {"count": 1, "first_attempt": now}
        else:
            record["count"] += 1
            self.failed_attempts[client_ip] = record

    def reset_failed_attempts(self, client_ip: str):
        """Clears failed attempts for an IP upon successful authentication."""
        self.failed_attempts.pop(client_ip, None)
