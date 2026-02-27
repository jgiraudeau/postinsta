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
