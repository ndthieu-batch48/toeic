from contextlib import contextmanager
from fastapi import HTTPException, status
import mysql.connector
from ..core.app_config import app_config

def connect():
    return mysql.connector.connect(
        host=app_config.MYSQL_HOST,
        user=app_config.MYSQL_USER,
        password=app_config.MYSQL_PASSWORD,
        database=app_config.MYSQL_DB,
    )

connection_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name = "fastapi_pool",
    pool_size = 5,
    host=app_config.MYSQL_HOST,
    user=app_config.MYSQL_USER,
    password=app_config.MYSQL_PASSWORD,
    database=app_config.MYSQL_DB
)

@contextmanager
def get_db_cursor(dictionary=True, autocommit=False):
    """Context manager for database operations"""
    conn = connection_pool.get_connection()
    try:
        with conn.cursor(dictionary=dictionary) as cursor:
            yield cursor
        if not autocommit:
            conn.commit()
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
            detail="Database service unavailable."
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected database error: {str(e)}"
        )
    finally:
        conn.close()


def execute_query(query: str, params=None, fetch_one=False, many=False):
    """
    Execute a query with better error handling.
    - fetch_one: returns single row if True
    - many: executes executemany() if True
    """
    with get_db_cursor() as cursor:
        if many:
            cursor.executemany(query, params or ())
        else:
            cursor.execute(query, params or ())
        
        if fetch_one:
            return cursor.fetchone()
        return cursor.fetchall()