import { NextResponse } from 'next/server';
import * as db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, entryRow, feedback, statut } = await request.json();

    const client = await db.getClientByToken(token);
    if (!client) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    const updates: any = {};
    if (feedback !== undefined) updates.feedback = feedback;
    if (statut !== undefined) updates.statut = statut;

    await db.updateEntry(client, entryRow, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
