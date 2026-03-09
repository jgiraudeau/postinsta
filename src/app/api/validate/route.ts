import { NextResponse } from 'next/server';
import { getClientById, updateEntry } from '@/lib/airtable';

export async function POST(request: Request) {
  try {
    const { clientId, row, statut } = await request.json();

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    await updateEntry(client.sheetId, row, { statut });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error validating:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
