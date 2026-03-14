import { GoogleGenAI, Modality } from '@google/genai';
import type { ClientProfile, CalendarEntry } from '@/types';
import { imagePrompt } from './prompts/image';
import { saveImage } from './storage';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateImage(
  profile: ClientProfile,
  entry: CalendarEntry,
  clientSlug: string
): Promise<string> {
  const prompt = imagePrompt(profile, entry);

  const isVertical = entry.type === 'story' || entry.type === 'reel';

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error('Aucune image générée');

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const buffer = Buffer.from(part.inlineData.data!, 'base64');
      const filename = `${clientSlug}_${entry.date}_${Date.now()}.png`;
      return saveImage(buffer, filename);
    }
  }

  throw new Error('Aucune image dans la réponse Gemini');
}

// Génère toutes les slides d'un carrousel
export async function generateCarouselImages(
  profile: ClientProfile,
  entry: CalendarEntry,
  clientSlug: string
): Promise<{ imageUrl: string; extraImages: string[] }> {
  // Parse les slides depuis le image_prompt
  const slideTexts = entry.image_prompt
    .split(/Slide\s+\d+\s*(?:\([^)]*\))?\s*:/i)
    .filter(s => s.trim().length > 0);

  const allUrls: string[] = [];

  for (let i = 0; i < slideTexts.length; i++) {
    console.log(`[Carousel] Generating slide ${i + 1}/${slideTexts.length}...`);

    // Créer une entrée temporaire avec le prompt d'une seule slide
    const slideEntry: CalendarEntry = {
      ...entry,
      image_prompt: `Slide ${i + 1} d'un carrousel Instagram : ${slideTexts[i].trim()}`,
    };

    const url = await generateImage(profile, slideEntry, clientSlug);
    allUrls.push(url);
  }

  if (allUrls.length === 0) {
    throw new Error('Aucune slide générée pour le carrousel');
  }

  return {
    imageUrl: allUrls[0],
    extraImages: allUrls.slice(1),
  };
}
