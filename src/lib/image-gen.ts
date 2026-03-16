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

// Parse le image_prompt d'un carrousel en slides individuelles
function parseSlides(prompt: string): string[] {
  // Try multiple patterns for slide separation
  const patterns = [
    /Slide\s*\d+\s*(?:\([^)]*\))?\s*[:\-–]/gi,   // "Slide 1 :", "Slide 1 -", "Slide1:"
    /\d+\s*[.)\-–]\s*/g,                            // "1. ", "1) ", "1 - "
  ];

  for (const pattern of patterns) {
    const parts = prompt.split(pattern).filter(s => s.trim().length > 0);
    if (parts.length >= 2) {
      console.log(`[Carousel] Parsed ${parts.length} slides with pattern ${pattern}`);
      return parts;
    }
  }

  console.warn(`[Carousel] Could not parse slides from prompt, will generate 4 variations`);
  console.warn(`[Carousel] Prompt was: ${prompt.substring(0, 200)}...`);
  return [];
}

// Génère toutes les slides d'un carrousel
export async function generateCarouselImages(
  profile: ClientProfile,
  entry: CalendarEntry,
  clientSlug: string
): Promise<{ imageUrl: string; extraImages: string[] }> {
  const slideTexts = parseSlides(entry.image_prompt);

  // If parsing found slides, use them. Otherwise generate 4 slides from the global prompt.
  const totalSlides = slideTexts.length >= 2 ? slideTexts.length : 4;

  console.log(`[Carousel] Will generate ${totalSlides} slides for "${entry.titre}"`);

  const allUrls: string[] = [];

  for (let i = 0; i < totalSlides; i++) {
    console.log(`[Carousel] Generating slide ${i + 1}/${totalSlides}...`);

    let slidePrompt: string;
    if (slideTexts[i]) {
      slidePrompt = `Slide ${i + 1} d'un carrousel Instagram (${totalSlides} slides au total) : ${slideTexts[i].trim()}`;
    } else {
      // Fallback : generate distinct slides from the global prompt
      const slideRole = i === 0 ? 'couverture accrocheuse avec le titre'
        : i === totalSlides - 1 ? 'slide finale avec call-to-action'
        : `slide ${i + 1} avec un point clé différent`;
      slidePrompt = `Slide ${i + 1}/${totalSlides} d'un carrousel Instagram. Rôle : ${slideRole}. Sujet : ${entry.image_prompt}`;
    }

    const slideEntry: CalendarEntry = {
      ...entry,
      image_prompt: slidePrompt,
    };

    try {
      const url = await generateImage(profile, slideEntry, clientSlug);
      allUrls.push(url);
    } catch (err) {
      console.error(`[Carousel] Slide ${i + 1} failed:`, err);
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
