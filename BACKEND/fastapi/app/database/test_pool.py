from mysql.connector.aio import connect
from contextlib import asynccontextmanager
from ..core.app_config import app_config

config = {
    "host": app_config.MYSQL_HOST,
    "port": 3306,
    "user": app_config.MYSQL_USER,
    "password": app_config.MYSQL_PASSWORD,
    "database": app_config.MYSQL_DB,
}

@asynccontextmanager
async def get_db_connection():
    """Context manager for database connection"""
    conn = await connect(**config)
    try:
        yield conn
    finally:
        await conn.close()

@asynccontextmanager
async def get_cursor():
    """Context manager for database cursor"""
    async with get_db_connection() as conn:
        cursor = await conn.cursor(dictionary=True)
        try:
            yield cursor
        finally:
            await cursor.close()

