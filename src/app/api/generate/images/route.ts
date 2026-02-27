import { NextResponse } from 'next/server';
import { getClientById, readProfile, readCalendar, updateEntry } from '@/lib/sheets';
import { generateImage } from '@/lib/image-gen';

export const maxDuration = 300; // 5 minutes max (nécessite plan Pro Vercel)

export async function POST(request: Request) {
  try {
    const { clientId } = await request.json();

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await readProfile(client.sheetId);
    const calendar = await readCalendar(client.sheetId);

    const toGenerate = calendar.filter((e) => !e.image_url && e.image_prompt && e.statut !== 'rejeté');
    const results = [];

    for (const entry of toGenerate) {
      const imageUrl = await generateImage(profile, entry, client.sheetId);
      await updateEntry(client.sheetId, entry.row!, { image_url: imageUrl });
      results.push({ row: entry.row, image_url: imageUrl });
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération des images' }, { status: 500 });
  }
}
