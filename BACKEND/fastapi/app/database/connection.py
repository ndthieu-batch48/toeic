import mysql.connector
from ..core.app_config import app_config

def connect():
    return mysql.connector.connect(
        host=app_config.MYSQL_HOST,
        user=app_config.MYSQL_USER,
        password=app_config.MYSQL_PASSWORD,
        database=app_config.MYSQL_DB,
    )