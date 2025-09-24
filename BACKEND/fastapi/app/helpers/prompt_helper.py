LANGUAGE_MAP = {
    "vi": "Vietnamese",
    "ja": "Japanese", 
    "en": "English",
}

def getLanguageById(langId):
    """
    Get language name by language ID or code.
    
    Args:
        langId: Language code (str)
        
    Returns:
        str: Language name, defaults to Vietnamese if not found
    """
    return LANGUAGE_MAP.get(langId, "Vietnamese")


def build_question_translation_prompt(question_block_json, language_id):
    target_language = getLanguageById(language_id)
    
    prompt = f"""
    You are a JSON translator.
    Given a JSON object, translate all string values into {target_language} while keeping the JSON structure, keys, and formatting exactly the same.
    Do not add or remove anything from the original object's structure.
    After translating, add a new field named "language_id" with the value of "{language_id}" to the top level of the JSON object.
    Your response must be a single, valid JSON object, with no comments, explanations, or code block formatting (e.g., no backticks or language specifiers).

    Input: {question_block_json}
    """
    return prompt