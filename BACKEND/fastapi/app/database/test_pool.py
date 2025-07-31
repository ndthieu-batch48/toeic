import logging
from typing import Optional, Dict, Any
import aiomysql
import asyncio

from contextlib import asynccontextmanager
from ..core.app_config import app_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance: Optional['DatabaseManager'] = None
    _pool: Optional[aiomysql.Pool] = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    async def initialize(cls) -> aiomysql.Pool:
        """Initialize database connection pool (singleton)"""
        if cls._pool is None:
            async with cls._lock:
                if cls._pool is None:
                    try:
                        cls._pool = await aiomysql.create_pool(
                            host=app_config.MYSQL_HOST,
                            port=getattr(app_config, 'MYSQL_PORT', 3306),
                            user=app_config.MYSQL_USER,
                            password=app_config.MYSQL_PASSWORD,
                            db=app_config.MYSQL_DB,
                            
                            # Pool configuration
                            minsize=getattr(app_config, 'DB_POOL_MIN_SIZE', 5),
                            maxsize=getattr(app_config, 'DB_POOL_MAX_SIZE', 20),
                            
                            # Connection configuration
                            autocommit=False,
                            charset='utf8mb4',
                            cursorclass=aiomysql.DictCursor,
                            
                            # Timeout settings
                            connect_timeout=getattr(app_config, 'DB_CONNECT_TIMEOUT', 30),
                            
                            # Connection health check
                            pool_recycle=getattr(app_config, 'DB_POOL_RECYCLE', 7200),  # 2 hours
                            
                            # SQL mode configuration
                            sql_mode="STRICT_TRANS_TABLES",
                        )
                        if cls._pool:
                            logger.info(f"Database pool created: min={cls._pool.minsize}, max={cls._pool.maxsize}")
                    except Exception as e:
                        logger.error(f"Failed to create database pool: {e}")
                        raise
        if cls._pool is None:
            raise RuntimeError("Failed to initialize database pool")
        return cls._pool


@asynccontextmanager
async def get_db_connection():
    """Get database connection from pool with proper error handling"""
    pool = await DatabaseManager.initialize()
    conn = None
    try:
        conn = await pool.acquire()
        # Validate connection is alive
        await conn.ping()
        yield conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        if conn:
            try:
                await pool.release(conn)
            except:
                pass  # Connection might be broken
        raise
    finally:
        if conn:
            try:
                await pool.release(conn)
            except Exception as e:
                logger.error(f"Error releasing connection: {e}")


@asynccontextmanager
async def get_cursor(auto_commit=False):
    """Get cursor with automatic connection management"""
    async with get_db_connection() as conn:
        cursor = None
        try:
            cursor = await conn.cursor()
            yield cursor, conn
            if auto_commit and not conn.get_autocommit():
                await conn.commit()
        except Exception as e:
            if not conn.get_autocommit():
                await conn.rollback()
            logger.error(f"Database cursor error: {e}")
            raise
        finally:
            if cursor:
                await cursor.close()


def with_transaction(func):
    """Decorator for automatic transaction management"""
    async def wrapper(*args, **kwargs):
        async with get_db_connection() as conn:
            cursor = None
            try:
                cursor = await conn.cursor()
                result = await func(cursor, conn, *args, **kwargs)
                await conn.commit()
                return result
            except Exception as e:
                await conn.rollback()
                logger.error(f"Transaction rolled back due to error: {e}")
                raise
            finally:
                if cursor:
                    await cursor.close()
    return wrapper