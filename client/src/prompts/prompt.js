export const TranslationPrompts = {
  buildTranslationPrompt: (question, answerText, targetLanguage) => {
    return (
      `Translate the following multiple-choice question: "${question}" and translate its answer options "${answerText}" into ${targetLanguage}. ` +
      `The output should be follow the TOEIC test format. ` +
      `Do not explain anything.`
    );
  },
};
