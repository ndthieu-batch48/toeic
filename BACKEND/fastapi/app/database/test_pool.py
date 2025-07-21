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
                if cls._pool is None:  # Double-check locking
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
                            cursorclass=aiomysql.DictCursor, # Return data as dict type 
                            
                            # Timeout settings
                            connect_timeout=getattr(app_config, 'DB_CONNECT_TIMEOUT', 30),
                            
                            # Connection health check
                            pool_recycle=getattr(app_config, 'DB_POOL_RECYCLE', 3600),  # 1 hour
                        )
                        if cls._pool:
                            logger.info(f"Database pool created: min={cls._pool.minsize}, max={cls._pool.maxsize}")
                    except Exception as e:
                        logger.error(f"Failed to create database pool: {e}")
                        raise
        if cls._pool is None:
            raise RuntimeError("Failed to initialize database pool")
        return cls._pool
    
    @classmethod
    async def close(cls):
        """Close database connection pool"""
        if cls._pool:
            logger.info("Closing database connection pool...")
            try:
                # First, close the pool
                cls._pool.close()
                
                # Wait for all connections to be closed
                await cls._pool.wait_closed()
                
                # Clear the pool reference
                cls._pool = None
                logger.info("Database connection pool closed successfully")
                
            except Exception as e:
                logger.error(f"Error closing database pool: {e}")
                # Don't re-raise during shutdown
                cls._pool = None
    
    @classmethod
    async def get_pool_status(cls) -> Dict[str, Any]:
        """Get current pool status for monitoring"""
        if cls._pool:
            return {
                "size": cls._pool.size,
                "freesize": cls._pool.freesize,
                "minsize": cls._pool.minsize,
                "maxsize": cls._pool.maxsize,
                "closed": cls._pool.closed
            }
        return {"status": "not_initialized"}
    
    @classmethod
    async def health_check(cls) -> bool:
        """Health check for database connection"""
        try:
            pool = await cls.initialize()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1")
                    result = await cursor.fetchone()
                    return result is not None
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

@asynccontextmanager
async def get_db_connection():
    """Get database connection from pool"""
    pool = await DatabaseManager.initialize()
    conn = None
    try:
        conn = await pool.acquire()
        yield conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise
    finally:
        if conn:
            await pool.release(conn)

@asynccontextmanager
async def get_cursor():
    """Get cursor with automatic connection management"""
    async with get_db_connection() as conn:
        cursor = None
        try:
            cursor = await conn.cursor()
            yield cursor, conn
        except Exception as e:
            logger.error(f"Database cursor error: {e}")
            raise
        finally:
            if cursor:
                await cursor.close()

# Transaction decorator for automatic rollback
def with_transaction(func):
    """Decorator for automatic transaction management"""
    async def wrapper(*args, **kwargs):
        async with get_cursor() as (cursor, conn):
            try:
                result = await func(cursor, conn, *args, **kwargs)
                await conn.commit()
                return result
            except Exception as e:
                await conn.rollback()
                logger.error(f"Transaction rolled back due to error: {e}")
                raise
    return wrapper