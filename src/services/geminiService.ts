// The Gemini path is strictly opt-in: results only improve when the user
// supplies their own key (stored in this browser's localStorage, never in the
// bundle). Without a key every function is a no-op and search falls back to
// the on-device models and local scoring.

import type { EntityData } from '@/types/entityTypes';
import { toast } from '@/components/ui/use-toast';

const API_KEY_STORAGE = 'ethical-searcher-gemini-key';

export const getGeminiApiKey = (): string | null =>
  localStorage.getItem(API_KEY_STORAGE) || null;

export const setGeminiApiKey = (key: string) => {
  if (key.trim()) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
    return;
  }
  localStorage.removeItem(API_KEY_STORAGE);
};

export const searchWithGemini = async (query: string): Promise<EntityData[]> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    // No key, no request — callers fall back to the on-device ML path.
    return [];
  }

  const prompt = `You are a helpful search assistant specializing in ethical companies and creators.

Given the search query "${query}", search for real companies or creators that match this query.
Look for relevant ethical information about:
- Company or creator name (exact or similar to "${query}")
- Their industry or field
- Environmental practices and impact
- Labor practices and social responsibility
- Ethical certifications and standards
- Corporate governance and transparency
- Any controversies or ethical concerns

For EACH entity you find, return:
1. Name (required)
2. Type: "company" or "creator" (required)
3. Description: A brief summary (required)
4. Ethical score: A number from 0-100 based on ethical practices (required)
5. Categories: Industry, field, or relevance tags (required)
6. Certifications: List of any ethical/environmental certifications
7. Controversies: Any ethical concerns or issues, each with a title and description
8. Website: Official website URL if available
9. Ethical analysis: A brief ethical assessment

Format your response as a JSON array of objects, like:
[
  {
    "id": "1",
    "name": "Company Name",
    "type": "company",
    "description": "Brief description",
    "ethicalScore": 85,
    "categories": ["Category1", "Category2"],
    "certifications": ["Certification1"],
    "controversies": [{"title": "Issue", "description": "Details"}],
    "website": "https://example.com",
    "ethical_analysis": "Ethical assessment"
  }
]

Focus on providing REAL data about actual companies and creators. If you cannot find any real data about "${query}", respond with an empty array [].
`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Gemini API error details:', errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const responseData = await response.json();
  const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!match) return [];

  try {
    const entities = JSON.parse(match[0]);
    return entities.map((entity: Partial<EntityData>, index: number) => ({
      ...entity,
      id: entity.id || String(index + 1),
    }));
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', e);
    throw new Error('Could not interpret the Gemini response');
  }
};

/** Surfaces Gemini failures without ever substituting synthetic data. */
export const reportGeminiError = (error: unknown) => {
  toast({
    title: 'Gemini search unavailable',
    description: error instanceof Error ? error.message : 'The Gemini request failed',
    variant: 'destructive',
  });
};
