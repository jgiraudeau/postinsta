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

export function carouselSlidePrompt(
  profile: ClientProfile,
  entry: CalendarEntry,
  slideIndex: number,
  totalSlides: number
): string {
  const slideRole = slideIndex === 0
    ? 'Slide de couverture — titre accrocheur, visuel impactant'
    : slideIndex === totalSlides - 1
    ? 'Slide finale — call-to-action, invitation à interagir'
    : `Slide ${slideIndex + 1} — point clé ou conseil distinct`;

  return `Create slide ${slideIndex + 1} of ${totalSlides} for an Instagram carousel post.

Format: 1:1 square.
Style: Clean, modern, ${profile.couleurs ? `brand colors: ${profile.couleurs}` : 'minimal palette'}.
${profile.typo ? `Typography: ${profile.typo}` : ''}
Sector: ${profile.secteur}

CAROUSEL TOPIC: ${entry.image_prompt}

THIS SLIDE: ${slideRole}

VISUAL CONSISTENCY:
- Use the same color palette on every slide
- Maintain consistent layout and graphic style
- Each slide must work standalone but clearly belong to a series

IMPORTANT FOR TEXT:
1. Text must be 100% correct in FRENCH with proper accents (é, à, è, ô…)
2. If unsure of spelling, use abstract visuals instead of text
3. Keep text minimal — 1 to 3 words maximum
4. NO TYPOS

Professional quality, Instagram-optimized, 1:1 square format.`;
}
