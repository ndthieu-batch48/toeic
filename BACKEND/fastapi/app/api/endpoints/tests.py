from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.helpers.safe_type import safe_int, safe_str
from ...schemas.test import Test, Part, TestPart
from ...auth.dependencies import get_current_user
from ...database.connection import connect
from ...database.queries import SELECT_ALL_TESTS_QUERY, GET_PARTS_BY_TEST_QUERY

router = APIRouter()

@router.get("/", response_model=List[Test])
async def get_all_tests() -> List[Test]:
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(SELECT_ALL_TESTS_QUERY)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    tests = [
			Test(
					id=safe_int(row["id"]),
					title=safe_str(row["title"]),
					description=safe_str(row["description"]),
					duration=safe_int(row["duration"])
			)
			for row in results if isinstance(row, dict)
    ]
    
    
    return tests

@router.get("/{test_id}/parts", response_model=List[Part])
async def get_parts(test_id: int):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_PARTS_BY_TEST_QUERY, (test_id,))
    parts = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return [
        Part(
        id=safe_int(part["id"]),
        title=safe_str(part["title"]),
        part_order=safe_str(part["part_order"]),
        audio_url=safe_str(part["audio_url"]),
        questionCount=safe_int(part["questionCount"]),
        partOrderNum=safe_int(part["partOrderNum"])
        )
        for part in parts if isinstance(part, dict)
    ]