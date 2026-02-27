import Anthropic from '@anthropic-ai/sdk';
import type { ClientProfile, CalendarEntry, CaptionResult } from '@/types';
import { calendarPrompt } from './prompts/calendar';
import { captionPrompt } from './prompts/caption';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateCalendar(profile: ClientProfile): Promise<CalendarEntry[]> {
  const prompt = calendarPrompt(profile);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Impossible de parser le calendrier généré');

  const entries: CalendarEntry[] = JSON.parse(jsonMatch[0]);
  return entries.map((e) => ({
    ...e,
    legende: '',
    hashtags: '',
    image_url: '',
    statut: 'brouillon',
    feedback: '',
  }));
}

export async function generateCaption(
  profile: ClientProfile,
  entry: CalendarEntry
): Promise<CaptionResult> {
  const prompt = captionPrompt(profile, entry);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Impossible de parser la légende générée');

  return JSON.parse(jsonMatch[0]) as CaptionResult;
}
