import { NextResponse } from 'next/server';
import { getClientById, readProfile, readCalendar, updateEntry } from '@/lib/sheets';
import { generateCaption } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const { clientId } = await request.json();

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await readProfile(client.sheetId);
    const calendar = await readCalendar(client.sheetId);

    // Generate captions for entries without one
    const toGenerate = calendar.filter((e) => !e.legende && e.statut !== 'rejeté');
    const results = [];

    for (const entry of toGenerate) {
      const caption = await generateCaption(profile, entry);
      await updateEntry(client.sheetId, entry.row!, {
        legende: caption.legende,
        hashtags: caption.hashtags,
      });
      results.push({ row: entry.row, ...caption });
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération des légendes' }, { status: 500 });
  }
}
