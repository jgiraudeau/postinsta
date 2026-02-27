import { NextResponse } from 'next/server';
import { getClientById, readProfile, readCalendar, updateEntry } from '@/lib/sheets';
import { generateImage } from '@/lib/image-gen';

export const maxDuration = 60;

// POST avec { clientId } → retourne la liste des posts à générer
// POST avec { clientId, row } → génère UNE seule image pour ce row
export async function POST(request: Request) {
  try {
    const { clientId, row } = await request.json();

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await readProfile(client.sheetId);
    const calendar = await readCalendar(client.sheetId);
    const toGenerate = calendar.filter((e) => !e.image_url && e.image_prompt && e.statut !== 'rejeté');

    // Mode listing : retourne juste les rows à traiter
    if (!row) {
      const pending = toGenerate.map((e) => ({ row: e.row, titre: e.titre }));
      return NextResponse.json({ pending, total: pending.length });
    }

    // Mode génération : génère une seule image
    const entry = toGenerate.find((e) => e.row === row);
    if (!entry) {
      return NextResponse.json({ error: 'Post non trouvé ou déjà généré' }, { status: 404 });
    }

    const imageUrl = await generateImage(profile, entry, client.sheetId);
    await updateEntry(client.sheetId, entry.row!, { image_url: imageUrl });

    return NextResponse.json({ row: entry.row, image_url: imageUrl });
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération des images' }, { status: 500 });
  }
}
