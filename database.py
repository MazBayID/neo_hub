import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "neo_hub.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS vault_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
    finally:
        connection.close()


def add_item(title, content):
    connection = get_connection()

    try:
        cursor = connection.execute(
            "INSERT INTO vault_items (title, content) VALUES (?, ?)",
            (title, content)
        )
        connection.commit()
        return cursor.lastrowid
    finally:
        connection.close()


def get_all_items():
    connection = get_connection()

    try:
        items = connection.execute(
            "SELECT * FROM vault_items ORDER BY id DESC"
        ).fetchall()
        return items
    finally:
        connection.close()


