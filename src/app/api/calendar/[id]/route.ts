import { NextResponse } from 'next/server';
import * as db from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params;

    // Token-based access for clients
    const client = await db.getClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    const calendar = await db.readCalendar(client);
    const profile = await db.readProfile(client);

    return NextResponse.json({
      calendar,
      clientName: client.name,
      airtableInterfaceUrl: client.airtableInterfaceUrl,
      canva_template_id: client.canva_template_id,
      profile
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
