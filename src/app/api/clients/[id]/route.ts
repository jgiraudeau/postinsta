import { NextResponse } from 'next/server';
import { getClientById, readProfile, readCalendar } from '@/lib/sheets';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await readProfile(client.sheetId);
    const calendar = await readCalendar(client.sheetId);

    return NextResponse.json({ client, profile, calendar });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
