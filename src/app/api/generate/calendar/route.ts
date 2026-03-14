import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { generateCalendar } from '@/lib/claude';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { clientId, startDate, endDate } = await request.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Dates par défaut : demain → +4 semaines
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fourWeeksLater = new Date(tomorrow);
    fourWeeksLater.setDate(fourWeeksLater.getDate() + 27);

    const start = startDate || tomorrow.toISOString().split('T')[0];
    const end = endDate || fourWeeksLater.toISOString().split('T')[0];

    // Supprimer les brouillons existants dans la plage de dates
    await db.deleteDraftEntries(client, start, end);

    const profile = await db.readProfile(client);
    const entries = await generateCalendar(profile, start, end);

    // Pour Airtable : append les nouveaux posts
    // Pour Sheets : on doit fusionner avec les existants
    if (client.source === 'airtable') {
      await db.writeCalendar(client, entries);
    } else {
      // Lire les entrées restantes (non-brouillons conservés) et ajouter les nouvelles
      const existing = await db.readCalendar(client);
      const merged = [...existing, ...entries].sort((a, b) => a.date.localeCompare(b.date));
      await db.writeCalendar(client, merged);
    }

    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du calendrier' }, { status: 500 });
  }
}
