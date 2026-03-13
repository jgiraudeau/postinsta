import type { ClientProfile, CalendarEntry } from '@/types';

export function imagePrompt(profile: ClientProfile, entry: CalendarEntry): string {
  const isVertical = entry.type === 'story' || entry.type === 'reel';
  const ratio = isVertical ? '9:16 vertical' : '1:1 square';

  return `Create a professional Instagram ${entry.type} image.
  
Format: ${ratio}.
Style: Clean, modern, ${profile.couleurs ? `using brand colors: ${profile.couleurs}` : 'minimal palette'}.
${profile.typo ? `Typography style: ${profile.typo}` : ''}
Sector: ${profile.secteur}

Content description: ${entry.image_prompt}

IMPORTANT INSTRUCTIONS FOR TEXT:
1. If the description asks for text (quotes, titles, words), the spelling must be 100% PERFECT and in FRENCH.
2. Respect all accents (é, à, è, ô, etc.).
3. If you are not certain of the spelling of a word, DO NOT write it. Use abstract symbols or no text at all instead.
4. Keep the text minimal. One or two words or a short quote maximum.
5. NO TYPOS. CHECK EVERY LETTER.

L'image doit être au format ${ratio}, de qualité professionnelle, et visuellement engageante. Pas de texte sauf si explicitement demandé dans la description.`;
}
