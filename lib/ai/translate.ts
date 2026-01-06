// AI Translation Service
// Handles Arabic <-> English translation

interface TranslationResult {
  translated_text: string;
  source_language: 'ar' | 'en';
  target_language: 'ar' | 'en';
}

const TRANSLATE_PROMPT = `You are a professional Arabic-English translator for a news application.

Translate the given text accurately while:
- Maintaining the journalistic tone
- Preserving proper nouns and names as appropriate
- Using Modern Standard Arabic (فصحى) for Arabic output
- Keeping the same level of formality as the source

Respond ONLY with the translated text, no explanations.`;

/**
 * Translate content between Arabic and English
 */
export async function translateContent(
  text: string,
  targetLanguage: 'ar' | 'en',
  apiKey: string
): Promise<TranslationResult> {
  const sourceLanguage = targetLanguage === 'ar' ? 'en' : 'ar';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: TRANSLATE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Translate the following ${sourceLanguage === 'ar' ? 'Arabic' : 'English'} text to ${targetLanguage === 'ar' ? 'Arabic' : 'English'}:\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const textContent = data.content.find((c: { type: string }) => c.type === 'text');

  if (!textContent) {
    throw new Error('No text content in Claude response');
  }

  return {
    translated_text: textContent.text,
    source_language: sourceLanguage,
    target_language: targetLanguage,
  };
}

/**
 * Ensure content is available in both languages
 * If one language is missing, translate from the other
 */
export async function ensureBilingual(
  content: { ar?: string; en?: string },
  apiKey: string
): Promise<{ ar: string; en: string }> {
  if (content.ar && content.en) {
    return { ar: content.ar, en: content.en };
  }

  if (content.ar && !content.en) {
    const result = await translateContent(content.ar, 'en', apiKey);
    return { ar: content.ar, en: result.translated_text };
  }

  if (content.en && !content.ar) {
    const result = await translateContent(content.en, 'ar', apiKey);
    return { ar: result.translated_text, en: content.en };
  }

  throw new Error('No content provided for translation');
}
