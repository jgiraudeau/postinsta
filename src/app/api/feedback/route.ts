import { NextResponse } from 'next/server';
import { getClientByToken, updateEntry } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const { token, entryRow, feedback } = await request.json();

    const client = await getClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    await updateEntry(client.sheetId, entryRow, { feedback });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
