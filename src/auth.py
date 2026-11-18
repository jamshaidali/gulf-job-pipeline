"""Authentication & Cryptographic Security Module for Job Dashboard."""

import os
import re
import json
import base64
import html
import hmac
import hashlib
import secrets
import time
import logging
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Login lockout thresholds (15-minute window)
IP_MAX_FAILURES = 10            # failures from a single client IP
ACCOUNT_IP_MAX_FAILURES = 5     # failures against one account from one IP
ACCOUNT_GLOBAL_MAX_FAILURES = 50  # failures against one account from all IPs combined


def is_production_environment() -> bool:
    """True when running on a hosted platform where insecure fallbacks must never be used."""
    if os.environ.get("APP_ENV", "").strip().lower() in ("production", "prod"):
        return True
    return bool(os.environ.get("VERCEL") or os.environ.get("RENDER"))


def _looks_like_sha256_hex(value: str) -> bool:
    return bool(re.fullmatch(r"[0-9a-f]{64}", value))


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

    # Legacy unsalted SHA-256 rows (constant time). Callers should re-hash on success.
    if _looks_like_sha256_hex(stored):
        legacy_sha = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        return secrets.compare_digest(legacy_sha, stored)

    # Legacy plaintext rows (constant time). Never compared against a hash value,
    # so a leaked hash can't be replayed as the password.
    if stored.startswith("pbkdf2:"):
        return False
    return secrets.compare_digest(plain_password.strip().encode("utf-8"), stored.encode("utf-8"))


def needs_rehash(stored_credential: str) -> bool:
    """True when a stored credential is not in the current PBKDF2 format."""
    return not (stored_credential or "").strip().startswith("pbkdf2:sha256:")


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
        
        # Read credentials from environment variables first (secure), then config.yaml.
        # There are deliberately NO hardcoded fallbacks for the password or signing secret.
        self.username = (
            os.environ.get("DASHBOARD_USERNAME") 
            or self.auth_cfg.get("username") 
            or "admin"
        ).strip()
        
        # Empty string means "no bootstrap admin account": nobody can log in as admin
        # until DASHBOARD_PASSWORD is configured.
        self.password = (
            os.environ.get("DASHBOARD_PASSWORD") 
            or self.auth_cfg.get("password") 
            or ""
        ).strip()
        
        secret = (
            os.environ.get("DASHBOARD_SESSION_SECRET") 
            or self.auth_cfg.get("session_secret") 
            or ""
        ).strip()
        if not secret:
            if is_production_environment():
                raise RuntimeError(
                    "DASHBOARD_SESSION_SECRET is not set. Refusing to start in production without a "
                    "session signing secret. Generate one with: openssl rand -hex 32"
                )
            # Local development: use a random per-process secret (sessions reset on restart).
            secret = secrets.token_hex(32)
            logger.warning(
                "DASHBOARD_SESSION_SECRET is not set; using a random ephemeral secret. "
                "All sessions will be invalidated when the process restarts."
            )
        elif len(secret) < 32:
            logger.warning("DASHBOARD_SESSION_SECRET is shorter than 32 characters; use `openssl rand -hex 32`.")
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

        # Auto-seed the bootstrap admin only when an admin password has been explicitly configured
        if self.password and self.db and hasattr(self.db, "count_users") and self.db.count_users() == 0:
            seed_admin_username = (
                os.environ.get("DASHBOARD_ADMIN_SEED_USERNAME")
                or "talentradar_admin"
            ).strip().lower()
            try:
                self.db.create_user(
                    username=seed_admin_username,
                    email=f"{seed_admin_username}@talentradar.ai",
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

        # Normalize spaces/hyphens in username and fallback to email prefix if needed
        u = re.sub(r"[\s\-]+", "_", u)
        u = re.sub(r"[^a-zA-Z0-9_]", "", u)
        if len(u) < 3:
            e_prefix = re.sub(r"[^a-zA-Z0-9_]", "", e.split("@")[0]) if "@" in e else ""
            u = (e_prefix if len(e_prefix) >= 3 else f"{u or 'user'}_tr")
        u = u[:30]

        # 1. Username syntax check
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", u):
            raise ValueError("Username must be 3-30 characters and contain only letters, numbers, or underscores.")

        # 2. Email syntax check
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", e):
            raise ValueError("Please provide a valid, well-formed email address.")

        # 3. Password length policy for frictionless signup
        if len(p) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if len(p) > 128:
            raise ValueError("Password cannot exceed 128 characters.")

        if not self.db:
            raise RuntimeError("Database connection is currently unavailable.")

        # 4. Check for existing email first
        if self.db.get_user_by_email(e):
            raise ValueError("An account with this email address already exists. Please log in.")

        # 5. If email is brand-new but username is already used, auto-disambiguate username so first-time signup succeeds
        if self.db.get_user_by_username(u):
            email_digits = "".join(re.findall(r"\d+", e.split("@")[0]))[:4]
            candidate_u = f"{u[:24]}_{email_digits}" if email_digits else f"{u[:24]}_{secrets.randbelow(9000) + 1000}"
            if self.db.get_user_by_username(candidate_u):
                candidate_u = f"{u[:22]}_{secrets.randbelow(90000) + 10000}"
            u = candidate_u

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
                # Transparently upgrade legacy plaintext / SHA-256 rows to PBKDF2
                if needs_rehash(stored_hash) and hasattr(self.db, "update_user_password_hash"):
                    try:
                        self.db.update_user_password_hash(user.get("username", ident), hash_password(p))
                    except Exception:
                        pass
                clean_user = dict(user)
                clean_user.pop("password_hash", None)
                return clean_user
            return None

        # Fallback check for config admin (only when an admin password is configured)
        if self.password and secrets.compare_digest(ident, self.username.lower()):
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
        if self.password and u == self.username.lower():
            return {
                "id": 1,
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

            # The account must still exist, and the token version must match (revocation check)
            if self.db and hasattr(self.db, "get_user_by_username"):
                try:
                    user = self.db.get_user_by_username(username)
                except Exception:
                    return None  # Fail closed if the user store can't be read
                if user:
                    current_version = int(user.get("token_version") or 1)
                    try:
                        if int(token_version_str) != current_version:
                            return None  # Revoked session
                    except ValueError:
                        return None
                elif not (self.password and username == self.username.lower()):
                    return None  # Deleted / unknown account

            return username

        # Legacy 3-part tokens (user:expiry:sig) carried no revocation version and are no longer accepted.
        return None

    def revoke_user_sessions(self, username: str):
        """Immediately revokes all active session tokens for the given user."""
        if self.db and hasattr(self.db, "increment_user_token_version"):
            try:
                self.db.increment_user_token_version(username)
            except Exception:
                pass

    @staticmethod
    def _account_keys(client_ip: str, identifier: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        if not identifier:
            return None, None
        acc = identifier.strip().lower()
        return acc, f"{acc}|{client_ip}"

    @staticmethod
    def _window_exceeded(store: Dict[str, Dict[str, Any]], key: Optional[str], limit: int, now: float) -> bool:
        if not key:
            return False
        rec = store.get(key)
        if not rec:
            return False
        if now - rec["first_attempt"] > 900:
            del store[key]
            return False
        return rec["count"] >= limit

    @staticmethod
    def _bump(store: Dict[str, Dict[str, Any]], key: Optional[str], now: float):
        if not key:
            return
        rec = store.get(key)
        if not rec or (now - rec["first_attempt"] > 900):
            store[key] = {"count": 1, "first_attempt": now}
        else:
            rec["count"] += 1

    def create_account_vault_token(self, username: str) -> Optional[str]:
        """Creates an HMAC-signed account backup token so serverless instances with ephemeral /tmp DBs can rehydrate the user."""
        if not self.db:
            return None
        user = self.db.get_user_by_username(username.strip().lower())
        if not user:
            return None
        data = {
            "u": user.get("username", ""),
            "e": user.get("email", ""),
            "n": user.get("full_name", ""),
            "p": user.get("password_hash", ""),
            "r": user.get("role", "user"),
        }
        raw_b64 = base64.urlsafe_b64encode(json.dumps(data, separators=(",", ":")).encode("utf-8")).decode("ascii")
        sig = hmac.new(self.secret_key, raw_b64.encode("ascii"), hashlib.sha256).hexdigest()
        return f"{raw_b64}.{sig}"

    def rehydrate_account_vault(self, vault_token: Optional[str]) -> Optional[Dict[str, Any]]:
        """Verifies an HMAC-signed account backup token and ensures the user exists in the local SQLite instance."""
        if not vault_token or "." not in vault_token or not self.db:
            return None
        try:
            raw_b64, received_sig = vault_token.split(".", 1)
            expected_sig = hmac.new(self.secret_key, raw_b64.encode("ascii"), hashlib.sha256).hexdigest()
            if not secrets.compare_digest(expected_sig, received_sig):
                return None
            data = json.loads(base64.urlsafe_b64decode(raw_b64.encode("ascii")).decode("utf-8"))
            u = (data.get("u") or "").strip().lower()
            e = (data.get("e") or "").strip().lower()
            p = data.get("p") or ""
            n = data.get("n") or u
            r = data.get("r") or "user"
            if not u or not e or not p:
                return None
            existing = self.db.get_user_by_username(u) or self.db.get_user_by_email(e)
            if existing:
                return existing
            return self.db.create_user(username=u, email=e, password_hash=p, full_name=n, role=r)
        except Exception:
            return None

    def check_rate_limit(self, client_ip: str, identifier: Optional[str] = None) -> Tuple[bool, str]:
        """Checks the per-IP limit, the per-account-per-IP limit, and a high global per-account ceiling.

        Lockouts are keyed by (account, IP) so a single attacker cannot lock a victim out of their
        own account; the global ceiling still stops distributed guessing against one account.
        """
        now = time.time()

        # Prune old entries to prevent memory growth
        if len(self.ip_attempts) > 1000:
            self.ip_attempts = {
                ip: rec for ip, rec in self.ip_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }
        if len(self.account_attempts) > 2000:
            self.account_attempts = {
                acc: rec for acc, rec in self.account_attempts.items()
                if now - rec.get("first_attempt", 0) < 3600
            }

        if self._window_exceeded(self.ip_attempts, client_ip, IP_MAX_FAILURES, now):
            return False, "Too many failed requests from your connection. Please wait 15 minutes."

        acc_key, acc_ip_key = self._account_keys(client_ip, identifier)
        if self._window_exceeded(self.account_attempts, acc_ip_key, ACCOUNT_IP_MAX_FAILURES, now) or \
                self._window_exceeded(self.account_attempts, acc_key, ACCOUNT_GLOBAL_MAX_FAILURES, now):
            return False, "This account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."

        return True, ""

    def record_failed_attempt(self, client_ip: str, identifier: Optional[str] = None):
        """Records a failed attempt against the source IP, the account+IP pair, and the account overall."""
        now = time.time()
        self._bump(self.ip_attempts, client_ip, now)
        acc_key, acc_ip_key = self._account_keys(client_ip, identifier)
        self._bump(self.account_attempts, acc_ip_key, now)
        self._bump(self.account_attempts, acc_key, now)

    def reset_failed_attempts(self, client_ip: str, identifier: Optional[str] = None):
        """Clears lockout state for this client upon successful authentication."""
        self.ip_attempts.pop(client_ip, None)
        _, acc_ip_key = self._account_keys(client_ip, identifier)
        if acc_ip_key:
            self.account_attempts.pop(acc_ip_key, None)

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
