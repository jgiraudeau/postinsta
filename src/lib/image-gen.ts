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

  // Retry up to 3 times if Gemini doesn't return an image
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await genai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        console.warn(`[ImageGen] Attempt ${attempt}: no parts in response`);
        continue;
      }

      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const buffer = Buffer.from(part.inlineData.data!, 'base64');
          const filename = `${clientSlug}_${entry.date}_${Date.now()}.png`;
          return saveImage(buffer, filename);
        }
      }

      console.warn(`[ImageGen] Attempt ${attempt}: no image in response parts`);
    } catch (err) {
      console.warn(`[ImageGen] Attempt ${attempt} failed:`, err);
      if (attempt === 3) throw err;
    }

    // Wait before retry
    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error('Aucune image après 3 tentatives Gemini');
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
  const totalSlides = slideTexts.length || 1;

  for (let i = 0; i < totalSlides; i++) {
    console.log(`[Carousel] Generating slide ${i + 1}/${totalSlides}...`);

    const slidePrompt = slideTexts[i]
      ? `Slide ${i + 1} d'un carrousel Instagram : ${slideTexts[i].trim()}`
      : entry.image_prompt;

    const slideEntry: CalendarEntry = {
      ...entry,
      image_prompt: slidePrompt,
    };

    try {
      const url = await generateImage(profile, slideEntry, clientSlug);
      allUrls.push(url);
    } catch (err) {
      console.error(`[Carousel] Slide ${i + 1} failed:`, err);
      // Continue with other slides instead of aborting entirely
    }
  }

  if (allUrls.length === 0) {
    throw new Error('Aucune slide générée pour le carrousel');
  }

  return {
    imageUrl: allUrls[0],
    extraImages: allUrls.slice(1),
  };
}
