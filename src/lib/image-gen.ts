import { GoogleGenAI, Modality } from '@google/genai';
import type { ClientProfile, CalendarEntry } from '@/types';
import { imagePrompt, carouselSlidePrompt } from './prompts/image';
import { saveImage } from './storage';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateImage(
  profile: ClientProfile,
  entry: CalendarEntry,
  clientSlug: string
): Promise<string> {
  const prompt = imagePrompt(profile, entry);

  // Retry up to 5 times with exponential backoff
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      // Add variation on retries to nudge Gemini toward producing an image
      const variation = attempt > 1 ? ` (artistic variation ${attempt}, prioritize generating a visual image)` : '';

      const response = await genai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt + variation,
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        console.warn(`[ImageGen] Attempt ${attempt}: no parts in response`);
        if (attempt === 5) throw new Error('Aucune image après 5 tentatives Gemini');
        await backoff(attempt);
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
      if (attempt === 5) throw err;
    }

    await backoff(attempt);
  }

  throw new Error('Aucune image après 5 tentatives Gemini');
}

// Génère une seule slide de carrousel
export async function generateCarouselSlide(
  profile: ClientProfile,
  entry: CalendarEntry,
  clientSlug: string,
  slideIndex: number,
  totalSlides: number
): Promise<string> {
  const prompt = carouselSlidePrompt(profile, entry, slideIndex, totalSlides);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const variation = attempt > 1 ? ` (variation ${attempt}, you MUST generate an image)` : '';

      const response = await genai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt + variation,
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            const buffer = Buffer.from(part.inlineData.data!, 'base64');
            const filename = `${clientSlug}_carousel_${entry.date}_s${slideIndex + 1}_${Date.now()}.png`;
            return saveImage(buffer, filename);
          }
        }
      }

      console.warn(`[CarouselSlide] Attempt ${attempt} for slide ${slideIndex + 1}: no image`);
    } catch (err) {
      console.warn(`[CarouselSlide] Attempt ${attempt} for slide ${slideIndex + 1} failed:`, err);
      if (attempt === 5) throw err;
    }

    await backoff(attempt);
  }

  throw new Error(`Slide ${slideIndex + 1}: aucune image après 5 tentatives`);
}

function backoff(attempt: number): Promise<void> {
  const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
  return new Promise(r => setTimeout(r, delay));
}
