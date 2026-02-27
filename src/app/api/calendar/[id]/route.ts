import { NextResponse } from 'next/server';
import { getClientByToken, readCalendar } from '@/lib/sheets';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params;

    // Token-based access for clients
    const client = await getClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    const calendar = await readCalendar(client.sheetId);

    return NextResponse.json({ calendar, clientName: client.name });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
