import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables from .env file
load_dotenv()

# Fetch credentials from environment variables
host = os.getenv("DB_HOST")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
database = os.getenv("DB_NAME")
import os
from dotenv import load_dotenv
import mysql.connector
from urllib.parse import urlparse

# Load environment variables from .env file (locally)
load_dotenv()


def _parse_db_url(url: str):
    """Parse a MySQL URL of the form mysql://user:pass@host:port/dbname and return components."""
    parsed = urlparse(url)
    # parsed.path starts with '/dbname'
    db_name = parsed.path[1:] if parsed.path and parsed.path.startswith("/") else parsed.path
    return {
        "host": parsed.hostname,
        "port": parsed.port,
        "user": parsed.username,
        "password": parsed.password,
        "database": db_name,
    }


def _get_db_config():
    """Return a dict with host, user, password, database (and optional port).

    Priority:
    1. Heroku-style single URL env vars: JAWSDB_URL, CLEARDB_DATABASE_URL, DATABASE_URL
    2. Individual env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
    """
    # Heroku/Addon URLs
    for key in ("JAWSDB_URL", "CLEARDB_DATABASE_URL", "DATABASE_URL"):
        url = os.getenv(key)
        if url:
            cfg = _parse_db_url(url)
            return cfg

    # Fallback to individual env vars (used locally)
    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
    }


def create_connection():
    """Create and return a mysql.connector connection using config from environment."""
    cfg = _get_db_config()
    try:
        connect_args = {
            "host": cfg.get("host"),
            "user": cfg.get("user"),
            "password": cfg.get("password"),
            "database": cfg.get("database"),
        }
        # include port if present
        if cfg.get("port"):
            connect_args["port"] = int(cfg.get("port"))

        return mysql.connector.connect(**connect_args)
    except mysql.connector.Error as e:
        # Keep the original behavior of printing the error before raising
        print(f"Error connecting to database: {e}")
        raise


def execute_query(query, values=None):
    """Execute a modifying query and return the last inserted id (if any)."""
    conn = None
    cursor = None
    try:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return cursor.lastrowid
    except mysql.connector.Error as e:
        print(f"Query execution error: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def fetch_results(query, values=None):
    """Execute a select query and return rows as list of dictionaries."""
    conn = None
    cursor = None
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, values)
        return cursor.fetchall()
    except mysql.connector.Error as e:
        print(f"Error fetching results: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()