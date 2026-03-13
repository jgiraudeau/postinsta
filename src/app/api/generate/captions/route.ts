import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { generateCaption } from '@/lib/claude';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { clientId, row } = await request.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await db.readProfile(client);
    const calendar = await db.readCalendar(client);
    const toGenerate = calendar.filter((e) => !e.legende.trim() && e.statut !== 'rejeté');

    // Mode listing : retourne les rows à traiter
    if (!row) {
      const pending = toGenerate.map((e) => ({ row: e.row, titre: e.titre }));
      return NextResponse.json({ pending, total: pending.length });
    }

    // Mode génération : une seule légende
    const entry = toGenerate.find((e) => e.row === row);
    if (!entry) {
      return NextResponse.json({ error: 'Post non trouvé ou déjà traité' }, { status: 404 });
    }

    const caption = await generateCaption(profile, entry);
    await db.updateEntry(client, entry.row!, {
      legende: caption.legende,
      hashtags: caption.hashtags,
    });

    return NextResponse.json({ row: entry.row, ...caption });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération des légendes' }, { status: 500 });
  }
}
