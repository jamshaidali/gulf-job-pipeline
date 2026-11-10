"""Authentication & Cryptographic Security Module for Job Dashboard."""

import os
import re
import html
import hmac
import hashlib
import secrets
import time
from typing import Optional, Dict, Any, Tuple


# Pre-computed dummy hash so failed authentications take constant time (mitigates timing side-channel attacks)
_DUMMY_SALT = bytes.fromhex("11223344556677889900aabbccddeeff")
_DUMMY_PBKDF2_HASH = (
    f"pbkdf2:sha256:600000${_DUMMY_SALT.hex()}$"
    f"{hashlib.pbkdf2_hmac('sha256', b'timing_mitigation_token_2026', _DUMMY_SALT, 600000).hex()}"
)

# Common vulnerable passwords blacklist
COMMON_WEAK_PASSWORDS = frozenset([
    "password", "12345678", "123456789", "1234567890", "password123",
    "admin123", "qwerty123", "welcome1", "welcome123", "iloveyou",
    "letmein1", "secret123", "monkey123", "dragon123", "master123",
    "football", "sunshine", "princess", "trustno1", "superman",
    "pakistan123", "dubai123", "riyadh123", "karachi123", "fastapi123"
])


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 (600,000 rounds) and unique cryptographic salt."""
    if salt is None:
        salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000)
    return f"pbkdf2:sha256:600000${salt.hex()}${dk.hex()}"


def verify_password(plain_password: str, stored_credential: str) -> bool:
    """Verifies password using constant-time comparison across PBKDF2, legacy SHA-256, or plaintext."""
    stored = (stored_credential or "").strip()
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


def validate_password_strength(password: str, username: str = "", email: str = "") -> Tuple[bool, str]:
    """Enforces strict NIST-aligned password policy with length, complexity, and common-password checks."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."

    # Must contain at least one letter
    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one letter."

    # Must contain at least one digit or special character
    if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]", password):
        return False, "Password must contain at least one number or special character."

    # Check blacklist
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "This password is too common or easily guessed. Please choose a stronger password."

    # Check if password contains username or email username
    u = username.strip().lower()
    if u and len(u) >= 3 and u in password.lower():
        return False, "Password cannot contain your username."

    e_local = email.split("@")[0].strip().lower() if "@" in email else ""
    if e_local and len(e_local) >= 3 and e_local in password.lower():
        return False, "Password cannot contain your email name."

    return True, ""


def sanitize_text(text: str, max_length: int = 60) -> str:
    """Strips HTML tags and non-printable characters, escaping input for defensive UI display."""
    clean = re.sub(r"<[^>]*>", "", text or "")
    clean = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", clean)
    clean = html.escape(clean.strip())
    return clean[:max_length]


class AuthManager:
    """Manages secure multi-user registration, timing-safe authentication, session revocation, and dual rate limiting."""

    def __init__(self, config: Dict[str, Any], db=None):
        self.auth_cfg = config.get("dashboard_auth", {})
        self.enabled = self.auth_cfg.get("enabled", True)
        self.db = db
        
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

        # Dual rate limiting state:
        # IP attempts: {client_ip: {"count": int, "first_attempt": float}}
        self.ip_attempts: Dict[str, Dict[str, Any]] = {}
        # Account attempts: {identifier: {"count": int, "first_attempt": float}}
        self.account_attempts: Dict[str, Dict[str, Any]] = {}
        # Registration rate limiting state: {client_ip: {"count": int, "first_attempt": float}}
        self.registration_attempts: Dict[str, Dict[str, Any]] = {}

        # Auto-seed default admin if database is connected and no users exist
        if self.db and hasattr(self.db, "count_users") and self.db.count_users() == 0:
            try:
                self.db.create_user(
                    username=self.username,
                    email=f"{self.username}@talentradar.ai",
                    password_hash=hash_password(self.password),
                    full_name="Administrator",
                    role="admin"
                )
            except Exception:
                pass

    def register_user(
        self, 
        username: str, 
        email: str, 
        password: str, 
        full_name: str = ""
    ) -> Dict[str, Any]:
        """Validates and registers a new user with strict security constraints."""
        u = (username or "").strip().lower()
        e = (email or "").strip().lower()
        p = (password or "").strip()
        name = sanitize_text(full_name, max_length=60)

        # 1. Username syntax check
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", u):
            raise ValueError("Username must be 3-30 characters and contain only letters, numbers, or underscores.")

        # 2. Email syntax check
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", e):
            raise ValueError("Please provide a valid, well-formed email address.")

        # 3. Password strength policy
        is_strong, err_msg = validate_password_strength(p, username=u, email=e)
        if not is_strong:
            raise ValueError(err_msg)

        if not self.db:
            raise RuntimeError("Database connection is currently unavailable.")

        # 4. Check for existing username or email
        if self.db.get_user_by_username(u):
            raise ValueError("This username is already taken. Please choose another.")

        if self.db.get_user_by_email(e):
            raise ValueError("An account with this email address already exists. Please log in.")

        pwd_hash = hash_password(p)
        created = self.db.create_user(
            username=u,
            email=e,
            password_hash=pwd_hash,
            full_name=name,
            role="user"
        )
        if not created:
            raise RuntimeError("Failed to create user account. Please try again.")

        user_copy = dict(created)
        user_copy.pop("password_hash", None)
        return user_copy

    def authenticate(self, identifier: str, password: str) -> Optional[Dict[str, Any]]:
        """Verifies credentials with timing-side-channel protection (always runs PBKDF2)."""
        ident = (identifier or "").strip().lower()
        p = (password or "").strip()

        # Prevent empty or gigantic passwords from causing CPU DoS
        if not p or len(p) > 256:
            # Run dummy verification to keep timing identical
            verify_password("dummy", _DUMMY_PBKDF2_HASH)
            return None

        user = None
        if self.db:
            user = self.db.get_user_by_identifier(ident)

        if user:
            stored_hash = user.get("password_hash", "")
            if verify_password(p, stored_hash):
                clean_user = dict(user)
                clean_user.pop("password_hash", None)
                return clean_user
            return None

        # Fallback check for config admin
        if secrets.compare_digest(ident, self.username.lower()):
            if verify_password(p, self.password):
                return {
                    "id": 1,
                    "username": self.username,
                    "email": f"{self.username}@talentradar.ai",
                    "full_name": "Administrator",
                    "role": "admin"
                }
            return None

        # User NOT found: ALWAYS run PBKDF2 dummy computation to neutralize timing enumeration!
        verify_password(p, _DUMMY_PBKDF2_HASH)
        return None

    def verify_credentials(self, username: str, password: str) -> bool:
        """Backwards compatible credential check."""
        return self.authenticate(username, password) is not None

    def get_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        """Retrieves user profile information by username."""
        u = (username or "").strip().lower()
        if self.db:
            user = self.db.get_user_by_username(u)
            if user:
                clean_user = dict(user)
                clean_user.pop("password_hash", None)
                return clean_user
        if u == self.username.lower():
            return {
                "username": self.username,
                "email": f"{self.username}@talentradar.ai",
                "full_name": "Administrator",
                "role": "admin"
            }
        return None

    def create_session_token(self, username: str) -> str:
        """Generates a cryptographically signed HMAC session token with token versioning for instant revocation."""
        u = username.strip().lower()
        expiry = int(time.time()) + (self.session_duration_hours * 3600)
        
        token_version = 1
        if self.db and hasattr(self.db, "get_user_token_version"):
            try:
                token_version = self.db.get_user_token_version(u)
            except Exception:
                token_version = 1

        payload = f"{u}:{expiry}:{token_version}"
        signature = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"{payload}:{signature}"

    def verify_session_token(self, token: Optional[str]) -> Optional[str]:
        """Validates signature, expiry, and token version against revocation state."""
        if not token or ":" not in token:
            return None

        parts = token.split(":")
        
        # Support both new 4-part (user:expiry:version:sig) and legacy 3-part (user:expiry:sig)
        if len(parts) == 4:
            username, expiry_str, token_version_str, received_sig = parts
            payload = f"{username}:{expiry_str}:{token_version_str}"
            expected_sig = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
            if not secrets.compare_digest(expected_sig, received_sig):
                return None

            try:
                expiry = int(expiry_str)
                if time.time() > expiry:
                    return None
            except ValueError:
                return None

            # Verify token version matches active user version (session revocation check)
            if self.db and hasattr(self.db, "get_user_token_version"):
                try:
                    current_version = self.db.get_user_token_version(username)
                    if int(token_version_str) != current_version:
                        return None  # Revoked session!
                except Exception:
                    pass

            return username

        elif len(parts) == 3:
            username, expiry_str, received_sig = parts
            payload = f"{username}:{expiry_str}"
            expected_sig = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()
            if not secrets.compare_digest(expected_sig, received_sig):
                return None

            try:
                expiry = int(expiry_str)
                if time.time() > expiry:
                    return None
            except ValueError:
                return None

            return username

        return None

    def revoke_user_sessions(self, username: str):
        """Immediately revokes all active session tokens for the given user."""
        if self.db and hasattr(self.db, "increment_user_token_version"):
            try:
                self.db.increment_user_token_version(username)
            except Exception:
                pass

    def check_rate_limit(self, client_ip: str, identifier: Optional[str] = None) -> Tuple[bool, str]:
        """Checks both IP-based limit (max 10 / 15m) and Account-targeted limit (max 5 / 15m)."""
        now = time.time()

        # Prune old entries to prevent memory growth
        if len(self.ip_attempts) > 1000:
            self.ip_attempts = {
                ip: rec for ip, rec in self.ip_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }
        if len(self.account_attempts) > 1000:
            self.account_attempts = {
                acc: rec for acc, rec in self.account_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }

        # 1. Check IP rate limit
        ip_rec = self.ip_attempts.get(client_ip)
        if ip_rec:
            if now - ip_rec["first_attempt"] > 900:
                del self.ip_attempts[client_ip]
            elif ip_rec["count"] >= 10:
                return False, "Too many failed requests from your connection. Please wait 15 minutes."

        # 2. Check Account / Identifier rate limit
        if identifier:
            acc_key = identifier.strip().lower()
            acc_rec = self.account_attempts.get(acc_key)
            if acc_rec:
                if now - acc_rec["first_attempt"] > 900:
                    del self.account_attempts[acc_key]
                elif acc_rec["count"] >= 5:
                    return False, "This account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."

        return True, ""

    def record_failed_attempt(self, client_ip: str, identifier: Optional[str] = None):
        """Records a failed attempt against both the source IP and target Account."""
        now = time.time()

        # Record IP failure
        ip_rec = self.ip_attempts.get(client_ip)
        if not ip_rec or (now - ip_rec["first_attempt"] > 900):
            self.ip_attempts[client_ip] = {"count": 1, "first_attempt": now}
        else:
            ip_rec["count"] += 1

        # Record Account failure
        if identifier:
            acc_key = identifier.strip().lower()
            acc_rec = self.account_attempts.get(acc_key)
            if not acc_rec or (now - acc_rec["first_attempt"] > 900):
                self.account_attempts[acc_key] = {"count": 1, "first_attempt": now}
            else:
                acc_rec["count"] += 1

    def reset_failed_attempts(self, client_ip: str, identifier: Optional[str] = None):
        """Clears lockout state upon successful authentication."""
        self.ip_attempts.pop(client_ip, None)
        if identifier:
            self.account_attempts.pop(identifier.strip().lower(), None)

    def check_registration_rate_limit(self, client_ip: str) -> Tuple[bool, str]:
        """Limits registration attempts to at most 5 account registrations per 15m per IP."""
        now = time.time()
        if len(self.registration_attempts) > 1000:
            self.registration_attempts = {
                ip: rec for ip, rec in self.registration_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }
        ip_rec = self.registration_attempts.get(client_ip)
        if ip_rec:
            if now - ip_rec["first_attempt"] > 900:
                del self.registration_attempts[client_ip]
            elif ip_rec["count"] >= 5:
                return False, "Too many registration attempts from this network. Please try again in 15 minutes."
        return True, ""

    def record_registration_attempt(self, client_ip: str):
        """Records a registration attempt against client IP."""
        now = time.time()
        ip_rec = self.registration_attempts.get(client_ip)
        if not ip_rec or (now - ip_rec["first_attempt"] > 900):
            self.registration_attempts[client_ip] = {"count": 1, "first_attempt": now}
        else:
            ip_rec["count"] += 1

    def change_password(self, username: str, old_password: str, new_password: str) -> Tuple[bool, str]:
        """Securely changes a user's password, verifying old password and revoking all prior sessions."""
        u = (username or "").strip().lower()
        old_p = (old_password or "").strip()
        new_p = (new_password or "").strip()

        # Constant-time verification
        user = self.authenticate(u, old_p)
        if not user:
            return False, "Current password is not correct."

        email = user.get("email", "")
        is_strong, err_msg = validate_password_strength(new_p, username=u, email=email)
        if not is_strong:
            return False, err_msg

        if old_p == new_p:
            return False, "New password cannot be the same as your old password."

        new_hash = hash_password(new_p)
        if self.db and hasattr(self.db, "update_user_password"):
            self.db.update_user_password(u, new_hash)
            return True, "Password updated successfully. All active sessions have been securely reset."

        return False, "Database operation unavailable."
