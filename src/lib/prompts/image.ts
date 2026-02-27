import type { ClientProfile, CalendarEntry } from '@/types';

export function imagePrompt(profile: ClientProfile, entry: CalendarEntry): string {
  return `Create a professional Instagram post image.

Style: Clean, modern, ${profile.couleurs ? `using brand colors: ${profile.couleurs}` : 'minimal palette'}.
${profile.typo ? `Typography style: ${profile.typo}` : ''}
Sector: ${profile.secteur}

Content description: ${entry.image_prompt}

The image should be square (1:1 ratio), suitable for Instagram, professional quality, and visually engaging. No text overlay unless specifically requested in the description.`;
}
