from contextlib import contextmanager
from fastapi import HTTPException, status
import mysql.connector
from ..core.app_config import app_config


connection_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name = "fastapi_pool",
    pool_size = 20,
    host=app_config.MYSQL_HOST,
    user=app_config.MYSQL_USER,
    password=app_config.MYSQL_PASSWORD,
    database=app_config.MYSQL_DB,
    connection_timeout=10,  # tránh treo pool vô hạn
)


@contextmanager
def get_db_cursor(dictionary=True, autocommit=False):
    """Context manager for database operations"""
    conn = connection_pool.get_connection()
    try:
        with conn.cursor(dictionary=dictionary, buffered=True) as cursor:
            yield cursor
        if not autocommit:
            conn.commit()
    except HTTPException:
        raise
    except mysql.connector.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,  # 409 for duplicate/constraint errors
            detail="Database integrity error: likely duplicate key or constraint violation."
        )
    except mysql.connector.ProgrammingError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  # Bad query or wrong params
            detail=f"Database programming error: {str(e)}"
        )
    except mysql.connector.DatabaseError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,  # Service issue
            detail=f"Database service unavailable: {str(e)}"
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected database error: {str(e)}"
        )
    finally:
        conn.close()
