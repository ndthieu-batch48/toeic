// Translation prompts for different parts
export const TRANSLATION_PROMPTS = {
  // Part 1 & 2 - Audio script translation
  AUDIO_SCRIPT: (audioScript, targetLanguage) =>
    `Translate the following English audio script into a concise ${targetLanguage} sentence:\n\n${audioScript}`,

  // Part 1 & 2 - Question and answers translation
  QUESTION_AND_ANSWERS: (questionContent, answerText, targetLanguage) =>
    `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`,

  // Part 3 & 4 - Combined script and question translation
  COMBINED_SCRIPT_QUESTION: (audioScript, questionContent, answerText, targetLanguage) =>
    `Translate the following into ${targetLanguage}, providing separate sections for the audio script and the question with its answer choices. Maintain the structure with the question followed by options labeled A, B, C, D:\n\n**Audio Script**:\n${audioScript}\n\n**Question**:\n${questionContent}\n\n**Options**:\n${answerText}`,

  // Part 5, 6, 7 - Question only translation
  QUESTION_ONLY: (questionContent, answerText, targetLanguage) =>
    `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`,

  // Answer choices only (when no valid question content)
  ANSWERS_ONLY: (answerText, targetLanguage) =>
    `Translate the following answer choices into ${targetLanguage}, maintaining the structure with options labeled A, B, C, D:\n\nOptions:\n${answerText}`,

  // Text content translation
  TEXT_CONTENT: (text, targetLanguage) =>
    `Translate the following text to ${targetLanguage}:\n\n${text}`,
};

// Image analysis and translation prompts
export const IMAGE_PROMPTS = {
  // Image analysis and translation
  IMAGE_ANALYSIS: (targetLanguage) =>
    `Analyze the image with the provided media_id and provide a concise ${targetLanguage} translation of its content. If the image contains text, translate that text. If it's a non-text image (e.g., a diagram or photo), provide a brief description in ${targetLanguage}.`,
};

// Error messages
export const ERROR_MESSAGES = {
  NO_TRANSLATION: 'Không có bản dịch nào.',
  TRANSLATION_ERROR: 'Lỗi khi xử lý bản dịch.',
  BASE64_ERROR: 'Lỗi: Dữ liệu chứa Base64 thay vì bản dịch.',
  IMAGE_API_ERROR: 'Lỗi: API trả về dữ liệu ảnh thay vì bản dịch.',
  IMAGE_TRANSLATION_ERROR: 'Lỗi khi dịch ảnh. Vui lòng thử lại.',
  TEXT_TRANSLATION_ERROR: 'Lỗi khi dịch văn bản. Vui lòng thử lại.',
  NO_CONTENT_TO_TRANSLATE: 'Không có nội dung để dịch.',
  QUESTION_TRANSLATION_ERROR: (targetLanguage) =>
    `Lỗi khi dịch câu hỏi hoặc đáp án sang ${targetLanguage}. Vui lòng thử lại.`,
  ANSWER_TRANSLATION_ERROR: (targetLanguage) => `Lỗi khi dịch đáp án sang ${targetLanguage}.`,
  NO_QUESTION_OR_ANSWERS: (targetLanguage) =>
    `Không có câu hỏi hoặc đáp án để dịch sang ${targetLanguage}.`,
};

// Special content markers
export const CONTENT_MARKERS = {
  SCRIPT_TRANSLATION_HEADER: '**Bản dịch script**:',
  QUESTION_TRANSLATION_HEADER: '**Bản dịch câu hỏi**:',
  IMAGE_DESCRIPTION_HEADER: '**Bản dịch/mô tả ảnh**',
  TEXT_TRANSLATION_HEADER: '**Bản dịch văn bản**',
};

// Content validation patterns
export const VALIDATION_PATTERNS = {
  BASE64_PATTERN: /^data:image\/[a-zA-Z]+;base64,/,
  NUMBER_ONLY_PATTERN: /^\d+$/,
  NUMBER_RANGE_PATTERN: /^\d+-\d+$/,
  QUESTION_NUMBER_PATTERN: /^\d+\.$/,
  ERROR_PATTERNS: [
    /Lỗi khi dịch/i,
    /Không có nội dung để dịch/i,
    /Không có bản dịch nào/i,
    /Lỗi: Dữ liệu chứa Base64/i,
    /Lỗi khi xử lý bản dịch/i,
    /Failed to.*translation/i,
  ],
};

// Filter patterns for cleaning translation content
export const FILTER_PATTERNS = {
  UNWANTED_LINES: [
    /^\*\*/, // Lines starting with **
    /^here/i, // Lines starting with "here"
    /^translation:/i, // Lines starting with "translation:"
    /^\s*$/, // Empty lines
  ],
};
