import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { generateCalendar } from '@/lib/claude';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { clientId } = await request.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await db.readProfile(client);
    const entries = await generateCalendar(profile);
    await db.writeCalendar(client, entries);

    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du calendrier' }, { status: 500 });
  }
}
