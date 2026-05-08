import sqlite3
from pathlib import Path

from .config import DATA_DIR

DB_PATH = DATA_DIR / "lendswift.db"


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password_hash TEXT,
                mobile TEXT UNIQUE,
                email_verified INTEGER DEFAULT 0,
                mobile_verified INTEGER DEFAULT 0,
                profile_status TEXT DEFAULT 'incomplete',
                aadhaar_last4 TEXT,
                pan_encrypted TEXT,
                pan_last4 TEXT,
                address TEXT,
                dob TEXT,
                failed_login_count INTEGER DEFAULT 0,
                locked_until TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS otp_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mobile TEXT NOT NULL,
                otp_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT NOT NULL,
                attempts INTEGER DEFAULT 0,
                verified INTEGER DEFAULT 0,
                request_ip TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                ip_address TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_otp_mobile_created ON otp_logs(mobile, created_at)")
